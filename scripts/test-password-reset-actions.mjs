import fs from 'node:fs';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const env = fs.readFileSync('.env.local', 'utf8');
const apiKey = env.match(/^NEXT_PUBLIC_FIREBASE_API_KEY=(.*)$/m)?.[1].replace(/^['"]|['"]$/g, '').trim();
assert(apiKey, 'Firebase client configuration is required');
const app = initializeApp({ credential: cert(JSON.parse(fs.readFileSync('lib/service-account.json', 'utf8'))) });
const auth = getAuth(app), db = getFirestore(app);
const base = process.env.E2E_ADMIN_BASE_URL || 'http://127.0.0.1:3000';
const suffix = `password-action-e2e-${Date.now()}-${randomBytes(3).toString('hex')}`;
const originalPassword = `Kbi!${randomBytes(16).toString('base64url')}`;
const newPassword = `Kbi!${randomBytes(16).toString('base64url')}`;
let uid;
const ids = [suffix+'-delete', suffix+'-reset'];
async function identity(action, body) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${apiKey}`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({...body,returnSecureToken:true}) });
  return { status:r.status, body:await r.json() };
}
try {
  const admins = await db.collection('users').where('role','in',['admin','super_admin']).get();
  let admin;
  for(const doc of admins.docs) {
    const profile=doc.data(); if(profile.isActive===false || profile.isLocked===true || profile.disabled===true) continue;
    const candidate=await auth.getUser(doc.id).catch(()=>null);
    if(candidate?.emailVerified && !candidate.disabled){admin=candidate;break;}
  }
  assert(admin,'An existing active administrator is required');
  const signed=await identity('signInWithCustomToken',{token:await auth.createCustomToken(admin.uid)});
  assert.equal(signed.status,200);
  const headers={authorization:`Bearer ${signed.body.idToken}`,'content-type':'application/json'};
  const u=await auth.createUser({email:suffix+'@example.com',password:originalPassword,emailVerified:true}); uid=u.uid;
  await auth.setCustomUserClaims(uid,{role:'technician'});
  await db.collection('users').doc(uid).set({uid,email:u.email,role:'technician',isActive:true});
  await db.collection('technicians').doc(uid).set({uid,userId:uid,email:u.email,name:'Temporary Password Action Test',isActive:true,isApproved:true,status:'APPROVED'});
  for(const id of ids) await db.collection('password_reset_requests').doc(id).set({technicianId:uid,email:u.email,name:'Temporary Password Action Test',status:'pending',requestedAt:FieldValue.serverTimestamp()});
  const url=`${base}/api/admin/password-reset-requests/${ids[0]}`;
  assert.equal((await fetch(url,{method:'DELETE'})).status,401);
  const techSigned=await identity('signInWithCustomToken',{token:await auth.createCustomToken(uid)});
  assert.equal((await fetch(url,{method:'DELETE',headers:{authorization:`Bearer ${techSigned.body.idToken}`}})).status,401);
  assert.equal((await fetch(url,{method:'DELETE',headers})).status,200);
  const deleted=await db.collection('password_reset_requests').doc(ids[0]).get();
  assert.equal(deleted.data().status,'deleted'); assert.equal(deleted.data().deletedBy,admin.uid);
  assert.equal((await auth.getUser(uid)).disabled,false);
  assert.equal((await identity('signInWithPassword',{email:u.email,password:originalPassword})).status,200);
  assert.equal((await fetch(url,{method:'DELETE',headers})).status,200);
  const audits=await db.collection('audit_logs').where('targetId','==',ids[0]).get(); assert.equal(audits.size,1);
  assert.equal((await fetch(url+'-missing',{method:'DELETE',headers})).status,404);
  const reset=await fetch(base+'/api/admin/technicians/control',{method:'POST',headers,body:JSON.stringify({action:'RESET_PASSWORD',technicianId:uid,data:{password:newPassword,requestId:ids[1],email:u.email}})});
  assert.equal(reset.status,200,'Reset action should succeed');
  assert.equal((await db.collection('password_reset_requests').doc(ids[1]).get()).data().status,'resolved');
  assert.equal((await identity('signInWithPassword',{email:u.email,password:newPassword})).status,200);
  assert.equal((await identity('signInWithPassword',{email:u.email,password:originalPassword})).status,400);
  assert.equal((await fetch(`${base}/api/admin/password-reset-requests/${ids[1]}`,{method:'DELETE',headers})).status,409);
  console.log('PASS: admin-only request deletion, account/password preservation, idempotence, audit record, missing/resolved handling, password reset, and new-password sign-in.');
} finally {
  for(const id of [...ids,...(uid?[uid]:[])]) {
    const logs=await db.collection('audit_logs').where('targetId','==',id).get();
    for(const log of logs.docs) await log.ref.delete();
  }
  for(const id of ids) await db.collection('password_reset_requests').doc(id).delete();
  if(uid){ await db.collection('technicians').doc(uid).delete(); await db.collection('users').doc(uid).delete(); await auth.deleteUser(uid); }
  console.log('Temporary test account and requests cleaned up.');
}
