import { initializeApp, getApps, getApp } from "firebase/app"
import { disableNetwork, initializeFirestore, setLogLevel } from "firebase/firestore"
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
}

const usingPlaceholders =
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.includes("YOUR_") ||
  !firebaseConfig.authDomain ||
  firebaseConfig.authDomain.includes("YOUR_") ||
  !firebaseConfig.projectId ||
  firebaseConfig.projectId.includes("YOUR_") ||
  !firebaseConfig.storageBucket ||
  firebaseConfig.storageBucket.includes("YOUR_") ||
  !firebaseConfig.messagingSenderId ||
  firebaseConfig.messagingSenderId.includes("YOUR_") ||
  !firebaseConfig.appId ||
  firebaseConfig.appId.includes("YOUR_")

export const isMockMode = usingPlaceholders

if (process.env.NODE_ENV === "production" && usingPlaceholders) {
  console.warn("Firebase environment variables contain placeholders or are missing. Running in client-side Mock Mode.")
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
})
setLogLevel("silent")

export const auth = getAuth(app)
export const storage = getStorage(app)

if (typeof window !== "undefined") {
  // Use default local persistence
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Auth Persistence Error:", error)
  })
  if (isMockMode) {
    try {
      void disableNetwork(db)
    } catch {}
  }
}
