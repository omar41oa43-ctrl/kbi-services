import { cert, getApp, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { getMessaging } from "firebase-admin/messaging"
import fs from "fs"
import path from "path"

function formatPrivateKey(key: string) {
    return key.replace(/\\n/g, "\n");
}


export function ensureFirebaseInit() {
    if (getApps().length > 0) {
        return;
    }

    // Check environment variables
    let serviceAccount: any = null;

    try {
        const envProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const envClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        const envPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            let keyStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
            // Support base64 encoding to prevent escaping issues in environment variables
            if (!keyStr.trim().startsWith("{")) {
                try {
                    keyStr = Buffer.from(keyStr, "base64").toString("utf-8");
                } catch {}
            }
            if (keyStr.startsWith('"') && keyStr.endsWith('"')) {
                keyStr = keyStr.slice(1, -1);
            }
            serviceAccount = JSON.parse(keyStr);
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            let keyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            if (keyStr.startsWith('"') && keyStr.endsWith('"')) {
                keyStr = keyStr.slice(1, -1);
            }
            serviceAccount = JSON.parse(keyStr);
        } else if (envClientEmail && envPrivateKey && envProjectId) {
            serviceAccount = {
                projectId: envProjectId,
                clientEmail: envClientEmail,
                privateKey: formatPrivateKey(envPrivateKey),
            };
        }

        if (!serviceAccount) {
            // Fallback to local service-account.json if present
            try {
                const saPath = path.join(process.cwd(), "lib", "service-account.json");
                if (fs.existsSync(saPath)) {
                    serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));
                }
            } catch (saErr) {
                // Silently fallback or log in dev
                if (process.env.NODE_ENV !== "production") {
                    console.warn("Failed to load local service-account.json:", saErr);
                }
            }
        }

        if (!serviceAccount) {
            throw new Error("No Service Account found in environment variables or service-account.json.");
        }

        if (serviceAccount.private_key) {
            serviceAccount.private_key = formatPrivateKey(serviceAccount.private_key);
        }

        initializeApp({
            credential: cert(serviceAccount),
        });
    } catch (e: any) {
      // Only log in production, warn in dev
      if (process.env.NODE_ENV === "production") {
        console.warn("Firebase admin init failed (using defaults):", e.message);
      }
    }

}

// Accessors that ensure init
export function getAdminDb() {
    ensureFirebaseInit();
    return getFirestore();
}

export function getAdminAuth() {
    ensureFirebaseInit();
    return getAuth();
}

export function getAdminMessaging() {
    ensureFirebaseInit();
    return getMessaging();
}

// Compatibility Proxies - with graceful failure if Firebase isn't initialized
function isFirebaseInitialized(): boolean {
  try {
    return getApps().length > 0;
  } catch {
    return false;
  }
}

function getSafeAdminDb(): any {
  try {
    ensureFirebaseInit();
    if (!isFirebaseInitialized()) return null;
    return getFirestore();
  } catch {
    return null;
  }
}

function getSafeAdminAuth(): any {
  try {
    ensureFirebaseInit();
    if (!isFirebaseInitialized()) return null;
    return getAuth();
  } catch {
    return null;
  }
}

// Create safe mock collections if Firebase isn't initialized
function createMockQuery() {
    return {
        where: () => createMockQuery(),
        orderBy: () => createMockQuery(),
        limit: () => createMockQuery(),
        startAfter: () => createMockQuery(),
        count: () => ({
            get: async () => ({ data: () => ({ count: 0 }) })
        }),
        get: async () => ({
            docs: [],
            size: 0,
            forEach: () => {},
        }),
    };
}

function createMockCollection(_path: string) {
    return {
        doc: () => createMockDoc(),
        where: () => createMockQuery(),
        orderBy: () => createMockQuery(),
        limit: () => createMockQuery(),
        startAfter: () => createMockQuery(),
        count: () => ({
            get: async () => ({ data: () => ({ count: 0 }) })
        }),
        get: async () => ({
            docs: [],
            size: 0,
            forEach: () => {},
        }),
        add: async () => ({ id: "mock-id" }),
    };
}

function createMockDoc() {
    return {
        get: async () => ({ exists: false }),
        set: async () => {},
        update: async () => {},
        delete: async () => {},
        id: "mock-doc-id",
    };
}

export const adminDb = {
    collection: (path: string) => {
        const db = getSafeAdminDb();
        if (db) return db.collection(path);
        return createMockCollection(path);
    },
    doc: (path: string) => {
        const db = getSafeAdminDb();
        if (db) return db.doc(path);
        return createMockDoc();
    },
    batch: () => {
        const db = getSafeAdminDb();
        if (db) return db.batch();
        return { commit: async () => {} };
    },
    runTransaction: async (fn: any) => {
        const db = getSafeAdminDb();
        if (db) return db.runTransaction(fn);
        return fn({ get: async () => ({ exists: false }) });
    }
} as any;

export const adminAuth = {
  getUser: async (uid: string) => {
    const auth = getSafeAdminAuth();
    if (auth) return auth.getUser(uid);
    throw new Error("Firebase not initialized");
  },
  getUserByEmail: async (email: string) => {
    const auth = getSafeAdminAuth();
    if (auth) return auth.getUserByEmail(email);
    throw new Error("Firebase not initialized");
  },
  listUsers: async (maxResults?: number, pageToken?: string) => {
    const auth = getSafeAdminAuth();
    if (auth) return auth.listUsers(maxResults, pageToken);
    return { users: [], pageToken: undefined };
  },
  deleteUser: async (uid: string) => {
    const auth = getSafeAdminAuth();
    if (auth) return auth.deleteUser(uid);
  },
  verifyIdToken: async (token: string) => {
    const auth = getSafeAdminAuth();
    if (auth) return auth.verifyIdToken(token);
    throw new Error("Firebase not initialized");
  },
  createUser: async (properties: any) => {
    const auth = getSafeAdminAuth();
    if (auth) return auth.createUser(properties);
    throw new Error("Firebase not initialized");
  },
  updateUser: async (uid: string, properties: any) => {
    const auth = getSafeAdminAuth();
    if (auth) return auth.updateUser(uid, properties);
    throw new Error("Firebase not initialized");
  },
  setCustomUserClaims: async (uid: string, claims: any) => {
    const auth = getSafeAdminAuth();
    if (auth) return auth.setCustomUserClaims(uid, claims);
    throw new Error("Firebase not initialized");
  }
} as any;

export async function verifyAdmin(request: Request, requireSuperAdmin = false) {
    try {
        const authHeader = request.headers.get("authorization") || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token) return null;

        ensureFirebaseInit();
        let isFirebaseOk = false;
        try {
            getApp();
            isFirebaseOk = true;
        } catch {
            isFirebaseOk = false;
        }

        if (!isFirebaseOk) return null;

        const decodedToken = await getAuth().verifyIdToken(token, true);
        const uid = decodedToken.uid;
        
        // Fetch user document from Firestore to verify role
        const userDoc = await getFirestore().collection("users").doc(uid).get();
        
        const envEmails = process.env.MASTER_ADMIN_EMAILS || "";
        const masterAdmins = envEmails.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
        const masterUid = process.env.MASTER_ADMIN_UID || "";
        
        const isMaster = (decodedToken.email && masterAdmins.includes(decodedToken.email.toLowerCase())) || uid === masterUid;

        if (isMaster) {
            return { uid, email: decodedToken.email, role: "super_admin" };
        }

        if (!userDoc.exists) return null;
        const data = userDoc.data();
        const role = data?.role;

        if (requireSuperAdmin && role !== "super_admin") {
            return null;
        }

        if (role === "admin" || role === "super_admin") {
            return { uid, email: decodedToken.email, role };
        }

        return null;
    } catch (error) {
        console.error("verifyAdmin failed:", error);
        return null;
    }
}
