
import { db } from "@/firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface LogEntry {
    action: string;
    details?: Record<string, any>;
    actorUid: string;
    actorEmail: string;
}

export async function logAdminAction(entry: LogEntry) {
    try {
        await addDoc(collection(db, "audit_logs"), {
            ...entry,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to log admin action:", error);
        // Fail silently so we don't block the actual action
    }
}
