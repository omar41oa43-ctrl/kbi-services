import test from 'node:test';
import assert from 'node:assert/strict';
import {validateUpload, verifyFirebaseToken, hashToken, MAX_BYTES} from '../supabase/functions/technician-files/security.ts';

const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'test-key'};
const now=Math.floor(Date.now()/1000);
async function jwt(overrides={}) {
 const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
 const body={iss:'https://securetoken.google.com/kbi2-f4f19',aud:'kbi2-f4f19',sub:'firebase-user',iat:now,exp:now+300,...overrides};
 const input=enc({alg:'RS256',kid:'test-key'})+'.'+enc(body);
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(input));
 return input+'.'+Buffer.from(signature).toString('base64url');
}
test('Firebase JWT verifies only the configured project and actual signature',async()=>{
 assert.equal(await verifyFirebaseToken(await jwt(),'kbi2-f4f19',[jwk]),'firebase-user');
 for(const fields of [{aud:'other-project'},{iss:'https://securetoken.google.com/other'},{exp:now-1},{iat:now+120},{sub:''},{firebase:{sign_in_provider:'anonymous'}}])
  await assert.rejects(()=>jwt(fields).then(t=>verifyFirebaseToken(t,'kbi2-f4f19',[jwk])));
 const token=await jwt();const [head,body,signature]=token.split('.');
 const tampered=Buffer.from(JSON.stringify({...JSON.parse(Buffer.from(body,'base64url')),sub:'victim'})).toString('base64url');
 await assert.rejects(()=>verifyFirebaseToken(`${head}.${tampered}.${signature}`,'kbi2-f4f19',[jwk]));
 await assert.rejects(()=>verifyFirebaseToken(token,'kbi2-f4f19',[]));
});
test('Uploads reject traversal, unsupported files, empty files and oversize data',()=>{
 const valid={category:'documents/trade_license',fileName:'Trade license.PDF',size:MAX_BYTES};
 assert.equal(validateUpload(valid).contentType,'application/pdf');
 assert.equal(validateUpload(valid).fileName,'Trade_license.PDF');
 for(const bad of [{category:'../victim'},{category:'jobs/x/../../victim'},{fileName:'bad.svg'},{size:0},{size:MAX_BYTES+1},{size:1.5}])
  assert.throws(()=>validateUpload({...valid,...bad}));
});
test('Download tokens are hashed before persistence',async()=>{
 const a=await hashToken('first'),b=await hashToken('second');
 assert.equal(a.length,64);assert.notEqual(a,b);assert.equal(a,await hashToken('first'));
});
