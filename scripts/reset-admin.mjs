import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";

const SERVICE_ACCOUNT_PATH = "./lib/service-account.json";

async function main() {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
        initializeApp({
            credential: cert(serviceAccount)
        });
        const auth = getAuth();
        
        const email = "admin@kbi.ae";
        console.log(`Locating admin user: ${email}...`);
        const user = await auth.getUserByEmail(email);
        
        console.log(`Setting password to 'AdminPassword123!' for ${email}...`);
        await auth.updateUser(user.uid, {
            password: "AdminPassword123!",
            emailVerified: true
        });
        console.log("? Admin password reset successfully!");
    } catch (e) {
        console.error(e);
    }
}
main();
