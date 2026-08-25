
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// NOTE: This requires service-account.json. 
// IF YOU DO NOT HAVE IT, YOU CANNOT USE THIS SCRIPT.
// Instead, use the Frontend Auto-Promotion method.

const SERVICE_ACCOUNT_PATH = "./service-account.json";

async function main() {
    try {
        console.log("Initializing...");

        let app;
        try {
            let keyPath = SERVICE_ACCOUNT_PATH;
            try {
                if (!readFileSync(keyPath)) {}
            } catch {
                keyPath = "./lib/service-account.json";
            }
            const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));
            app = initializeApp({ credential: cert(serviceAccount) });
        } catch (e) {
            console.log("⚠️ No service-account.json found in root or lib directory.");
            console.error("❌ CRITICAL: Service Account Key missing. Cannot wipe/seed users programmatically.");
            console.log("👉 Please delete/create users MANUALLY in Firebase Console.");
            process.exit(1);
        }

        const auth = getAuth(app);
        const db = getFirestore(app);

        // 1. Create New Admin (or overwrite)
        const email = "admin@kbi.ae";
        const password = "AdminPassword2026!"; // New strong password

        console.log(`Creating/Updating admin: ${email}`);

        try {
            const user = await auth.getUserByEmail(email);
            console.log("User exists. Updating password...");
            await auth.updateUser(user.uid, {
                password: password,
                emailVerified: true
            });
            // Force Firestore update
            await db.collection("users").doc(user.uid).set({
                email: email,
                role: "super_admin",
                name: "Super Admin",
                updatedAt: new Date()
            }, { merge: true });

        } catch (e) {
            if (e.code === 'auth/user-not-found') {
                console.log("User not found. Creating new...");
                const newUser = await auth.createUser({
                    email: email,
                    password: password,
                    emailVerified: true,
                    displayName: "Super Admin"
                });
                await db.collection("users").doc(newUser.uid).set({
                    email: email,
                    role: "super_admin",
                    name: "Super Admin",
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            } else {
                throw e;
            }
        }

        console.log("✅ Admin Reset Complete.");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
