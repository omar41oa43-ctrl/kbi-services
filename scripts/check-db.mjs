import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const SERVICE_ACCOUNT_PATH = "./lib/service-account.json";

async function main() {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
        initializeApp({
            credential: cert(serviceAccount)
        });
        const db = getFirestore();

        console.log("=== TECHNICIANS ===");
        const techs = await db.collection("technicians").get();
        techs.forEach(doc => {
            console.log(`Doc ID: ${doc.id}, isApproved: ${doc.data().isApproved}, name: ${doc.data().name || doc.data().full_name}, phone: ${doc.data().phone}`);
        });

        console.log("=== TECHNICIAN REQUESTS ===");
        const reqs = await db.collection("technician_requests").get();
        reqs.forEach(doc => {
            console.log(`Doc ID: ${doc.id}, status: ${doc.data().status}, name: ${doc.data().full_name || doc.data().name}, phone: ${doc.data().phone}`);
        });

        console.log("=== USERS ===");
        const users = await db.collection("users").get();
        users.forEach(doc => {
            console.log(`Doc ID: ${doc.id}, role: ${doc.data().role}, name: ${doc.data().name || doc.data().full_name}, email: ${doc.data().email}`);
        });

    } catch (e) {
        console.error(e);
    }
}

main();
