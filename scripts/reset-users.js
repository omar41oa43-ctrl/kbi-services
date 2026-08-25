
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const SERVICE_ACCOUNT_PATH = "./service-account.json";

async function main() {
    try {
        // 1. Initialize Admin SDK
        console.log("Initializing Firebase Admin...");
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

        // 2. Delete All Users
        console.log("Fetching all users...");
        let users = [];
        let pageToken = undefined;

        do {
            const result = await auth.listUsers(1000, pageToken);
            users.push(...result.users);
            pageToken = result.pageToken;
        } while (pageToken);

        console.log(`Found ${users.length} users. Deleting...`);

        if (users.length > 0) {
            await auth.deleteUsers(users.map(u => u.uid));
            console.log("All users deleted.");
        }

        // 3. Create Admin User
        console.log("Creating Admin User...");
        const adminUser = await auth.createUser({
            email: "admin@kbi.ae",
            password: "AdminPassword123!",
            displayName: "System Admin",
            emailVerified: true
        });
        console.log("Auth user created. ID:", adminUser.uid);

        console.log("Initializing Firestore...");
        const firestore = getFirestore(app);
        console.log("Writing to Firestore...");
        await firestore.collection("users").doc(adminUser.uid).set({
            email: "admin@kbi.ae",
            name: "System Admin",
            role: "super_admin",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log("Admin user created successfully:");
        console.log(`Email: ${adminUser.email}`);
        console.log(`UID: ${adminUser.uid}`);
        console.log(`Password: AdminPassword123!`);
        console.log("Firestore profile created.");

    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

main();
