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

        console.log("=== SERVICE REQUESTS ===");
        const reqs = await db.collection("service_requests").get();
        reqs.forEach(doc => {
            console.log(`Doc ID: ${doc.id}`);
            console.log(JSON.stringify(doc.data(), null, 2));
        });

    } catch (e) {
        console.error(e);
    }
}
main();
