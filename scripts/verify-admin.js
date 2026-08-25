
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const SERVICE_ACCOUNT_PATH = "./service-account.json";

async function main() {
    try {
        console.log("Initializing...");
        let keyPath = SERVICE_ACCOUNT_PATH;
        try {
            if (!readFileSync(keyPath)) {}
        } catch {
            keyPath = "./lib/service-account.json";
        }
        const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

        const app = initializeApp({
            credential: cert(serviceAccount)
        });

        const auth = getAuth(app);
        const db = getFirestore(app);

        console.log("Getting user by email 'admin@kbi.ae'...");
        const userRecord = await auth.getUserByEmail("admin@kbi.ae");
        console.log(`Auth User Found: ${userRecord.uid}`);

        console.log("Fetching Firestore Document...");
        const docSnap = await db.collection("users").doc(userRecord.uid).get();

        if (docSnap.exists) {
            console.log("Firestore Document Exists:");
            console.log(JSON.stringify(docSnap.data(), null, 2));
        } else {
            console.error("❌ Firestore Document DOES NOT EXIST!");

            // Auto-fix attempt
            console.log("Attempting to auto-fix...");
            await db.collection("users").doc(userRecord.uid).set({
                email: "admin@kbi.ae",
                name: "System Admin",
                role: "super_admin",
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log("✅ Fixed: Created missing document.");
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

main();
