import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.replace(/\\n/g, '\n');
    }
  }
}

let app;
if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });
} else {
  app = initializeApp({ projectId: 'kbi-uae' });
}

const db = getFirestore(app);

async function testTechnicians() {
  console.log('=== 1. CHECKING TECHNICIANS COLLECTION ===');
  const techsSnap = await db.collection('technicians').limit(10).get();
  console.log(`Found ${techsSnap.size} technician profiles:`);
  
  for (const doc of techsSnap.docs) {
    const d = doc.data();
    console.log(`- ID: ${doc.id}`);
    console.log(`  Name: ${d.name || d.displayName}`);
    console.log(`  Email: ${d.email}`);
    console.log(`  isApproved: ${d.isApproved}`);
    console.log(`  isActive: ${d.isActive}`);
    console.log(`  isOnline: ${d.isOnline}`);
    console.log(`  subscriptionStatus: ${d.subscriptionStatus}`);
  }

  console.log('\n=== 2. CHECKING ACTIVE JOBS / BOOKINGS ===');
  const bookingsSnap = await db.collection('bookings').limit(5).get();
  console.log(`Found ${bookingsSnap.size} sample bookings:`);
  for (const doc of bookingsSnap.docs) {
    const b = doc.data();
    console.log(`- Booking #${doc.id.substring(0, 6)}: ${b.device || b.service} (${b.status || 'PENDING'}) -> Assigned: ${b.assignedTechnician || b.technicianId || 'Unassigned'}`);
  }
}

testTechnicians().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
