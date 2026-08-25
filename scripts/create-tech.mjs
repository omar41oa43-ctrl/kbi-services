import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import fs from "fs";

const SERVICE_ACCOUNT_PATH = "./lib/service-account.json";

async function main() {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
        initializeApp({
            credential: cert(serviceAccount)
        });
        const auth = getAuth();
        const db = getFirestore();
        
        const email = "tech1@kbi.com";
        const password = "password123";
        const name = "Tech One";
        const phone = "+971501111111";

        console.log(`Checking if user ${email} already exists...`);
        let user;
        try {
            user = await auth.getUserByEmail(email);
            console.log(`User exists. Updating password...`);
            await auth.updateUser(user.uid, { password });
        } catch (e) {
            if (e.code === 'auth/user-not-found') {
                console.log(`Creating new auth user...`);
                user = await auth.createUser({
                    email,
                    password,
                    displayName: name,
                    emailVerified: true
                });
            } else {
                throw e;
            }
        }

        const uid = user.uid;
        console.log(`Setting up Firestore docs for UID: ${uid}...`);

        const now = Timestamp.now();

        // 1. users doc
        await db.collection("users").doc(uid).set({
            email,
            role: "technician",
            name,
            createdAt: now,
            updatedAt: now
        }, { merge: true });

        // 2. technicians doc
        await db.collection("technicians").doc(uid).set({
            name,
            phone,
            whatsapp: phone,
            email,
            skills: ["smartphone", "laptop"],
            isApproved: true,
            isActive: true,
            subscriptionStatus: "active",
            rating: 5.0,
            wallet_balance: 0,
            completed_jobs: 0,
            updatedAt: now,
            createdAt: now
        }, { merge: true });

        console.log("? Approved Technician user created successfully!");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (e) {
        console.error(e);
    }
}
main();
