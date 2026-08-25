const admin = require("firebase-admin");
const serviceAccount = require("../lib/service-account.json");

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }

    const db = admin.firestore();

    async function checkOrders() {
        console.log("Attempting to fetch orders from Firestore...");
        try {
            const snapshot = await db.collection("orders").get();

            if (snapshot.empty) {
                console.log("✅ Connection Successful. Status: NO ORDERS FOUND (Collection is empty).");
            } else {
                console.log(`✅ Connection Successful. Status: FOUND ${snapshot.size} ORDERS.`);
                snapshot.forEach(doc => {
                    console.log(` - ID: ${doc.id}, OrderID: ${doc.data().orderId}, Customer: ${doc.data().name || doc.data().customerName}`);
                });
            }
        } catch (error) {
            console.error("❌ FAILED to fetch orders:", error);
        }
    }

    checkOrders();

} catch (error) {
    console.error("❌ Initialization Error:", error);
}
