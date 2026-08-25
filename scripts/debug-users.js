import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const SERVICE_ACCOUNT_PATH = "./lib/service-account.json";

async function main() {
    try {
        console.log("Initializing Firebase Admin...");
        const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
        const app = initializeApp({
            credential: cert(serviceAccount)
        });

        const auth = getAuth(app);
        const db = getFirestore(app);

        console.log("Fetching all Firebase Auth users...");
        const result = await auth.listUsers(100);
        console.log(`Found ${result.users.length} users in Auth:`);
        
        for (const user of result.users) {
            console.log(`\n- Email: ${user.email}`);
            console.log(`  UID: ${user.uid}`);
            
            // Check users collection
            const userDoc = await db.collection("users").doc(user.uid).get();
            if (userDoc.exists) {
                console.log(`  Firestore 'users' doc: EXISTS (role: ${userDoc.data().role})`);
            } else {
                console.log(`  Firestore 'users' doc: MISSING ❌`);
            }

            // Check technicians collection
            const techDoc = await db.collection("technicians").doc(user.uid).get();
            if (techDoc.exists) {
                console.log(`  Firestore 'technicians' doc: EXISTS (isApproved: ${techDoc.data().isApproved})`);
            } else {
                console.log(`  Firestore 'technicians' doc: MISSING ❌`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
