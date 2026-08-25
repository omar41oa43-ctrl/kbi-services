
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const SERVICE_ACCOUNT_PATH = "./service-account.json";
const TARGET_UID = "K4XccP1AvpU4gI7C6Owuh3cPMKy2";

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

        console.log(`Promoting User UID: ${TARGET_UID}`);

        // 1. Update Auth Profile (Verify Email)
        await auth.updateUser(TARGET_UID, {
            emailVerified: true
        });
        console.log("✅ Auth: Email set to Verified.");

        // 2. Update Firestore Document
        const userRef = db.collection("users").doc(TARGET_UID);
        const docSnap = await userRef.get();

        if (docSnap.exists) {
            await userRef.update({
                role: "super_admin",
                updatedAt: new Date()
            });
            console.log("✅ Firestore: Role updated to 'super_admin'.");
        } else {
            console.log("⚠️ Document missing. Creating new one...");
            // Get email from auth to populate doc
            const userRecord = await auth.getUser(TARGET_UID);
            await userRef.set({
                email: userRecord.email,
                name: userRecord.displayName || "Admin User",
                role: "super_admin",
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log("✅ Firestore: Created new admin profile.");
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

main();
