"use server"

export async function checkEnvServer() {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

    let status = "Missing";
    let parseResult = "N/A";

    if (key) {
        status = `Present (Length: ${key.length})`;
        try {
            const parsed = JSON.parse(key);
            parseResult = `Valid JSON. Project ID: ${parsed.project_id}. Private Key starts with: ${parsed.private_key?.substring(0, 20)}...`;
        } catch (e: any) {
            parseResult = `Invalid JSON: ${e.message}`;
        }
    }

    // Also check if admin is initialized
    const admin = (await import("firebase-admin")).default;
    const appCount = admin.apps.length;

    return {
        keyStatus: status,
        parseResult,
        appCount,
        nodeEnv: process.env.NODE_ENV
    };
}
