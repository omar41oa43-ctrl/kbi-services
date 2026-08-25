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

        const email = "admin1@kbi.com";
        const password = "123q123q";

        console.log(`Checking if user ${email} already exists...`);
        let uid;
        try {
            const user = await auth.getUserByEmail(email);
            console.log(`User exists with UID: ${user.uid}. Deleting user to start fresh...`);
            await auth.deleteUser(user.uid);
            // Delete Firestore doc if exists
            await db.collection("technicians").doc(user.uid).delete();
            await db.collection("users").doc(user.uid).delete();
            console.log("Deleted old user.");
        } catch (e) {
            if (e.code !== 'auth/user-not-found') {
                throw e;
            }
        }

        console.log(`Creating user: ${email}...`);
        const newUser = await auth.createUser({
            email: email,
            password: password,
            emailVerified: true,
            displayName: "Admin1 Tech"
        });
        uid = newUser.uid;
        console.log(`Created Firebase Auth user. UID: ${uid}`);

        console.log("Creating user profile in users collection...");
        await db.collection("users").doc(uid).set({
            email: email,
            name: "Admin1 Tech",
            role: "technician",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log("Creating approved technician profile in Firestore...");
        await db.collection("technicians").doc(uid).set({
            uid: uid,
            email: email,
            name: "Admin1 Tech",
            phone: "+971500000000",
            skills: ["smartphone", "laptop"],
            isApproved: true,
            isActive: true,
            subscriptionStatus: "active",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log("-----------------------------------------");
        console.log("✅ User created and pre-approved!");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log("-----------------------------------------");

    } catch (error) {
        console.error("❌ Error running script:", error);
        process.exit(1);
    }
}

main();
