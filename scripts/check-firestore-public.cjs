const fs = require('fs');
const path = require('path');

// Read .env.local to get keys
const envPath = path.resolve(__dirname, '../.env.local');
let projectId = 'kbi-repairs'; // Default or from env
let apiKey = '';

try {
    const env = fs.readFileSync(envPath, 'utf8');
    const lines = env.split('\n');
    lines.forEach(line => {
        if (line.startsWith('NEXT_PUBLIC_FIREBASE_PROJECT_ID=')) {
            projectId = line.split('=')[1].trim().replace(/"/g, '');
        }
        if (line.startsWith('NEXT_PUBLIC_FIREBASE_API_KEY=')) {
            apiKey = line.split('=')[1].trim().replace(/"/g, '');
        }
    });
} catch (e) {
    console.log("Could not read .env.local, using defaults might fail if not set.");
}

async function check() {
    console.log(`Project: ${projectId}`);
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/site?key=${apiKey}`;
    console.log(`Fetching: ${url}`);

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error("Fetch failed:", res.status, res.statusText);
            const text = await res.text();
            console.error(text);
            return;
        }
        const json = await res.json();
        console.log("Data:");
        console.log(JSON.stringify(json, null, 2));

        const fields = json.fields || {};
        const addressAr = fields.addressAr ? (fields.addressAr.stringValue || "MISSING_VALUE") : "UNDEFINED";
        const footerTextAr = fields.footerTextAr ? (fields.footerTextAr.stringValue || "MISSING_VALUE") : "UNDEFINED";

        console.log("--------------------------------");
        console.log("addressAr:", addressAr);
        console.log("footerTextAr:", footerTextAr);
        console.log("--------------------------------");

    } catch (e) {
        console.error("Error:", e);
    }
}

check();
