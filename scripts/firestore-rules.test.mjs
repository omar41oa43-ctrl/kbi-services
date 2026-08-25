import fs from "node:fs"
import assert from "node:assert/strict"
import test, { after, before } from "node:test"

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

let environment

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: "kbi-rules-test",
    firestore: { rules: fs.readFileSync("firestore.rules", "utf8") },
  })

  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, "users", "admin-1"), { role: "admin", email: "admin@kbi.test" })
    await setDoc(doc(db, "users", "tech-1"), { role: "technician", email: "tech@kbi.test" })
    await setDoc(doc(db, "technicians", "tech-1"), {
      userId: "tech-1",
      isApproved: true,
      isActive: true,
      subscriptionStatus: "active",
      available: true,
    })
    await setDoc(doc(db, "notifications", "notice-1"), { userId: "tech-1", isRead: false })
  })
})

after(async () => {
  await environment?.cleanup()
})

test("anonymous users cannot read private profiles", async () => {
  const db = environment.unauthenticatedContext().firestore()
  await assertFails(getDoc(doc(db, "users", "tech-1")))
})

test("technicians can read themselves but cannot elevate their role", async () => {
  const db = environment.authenticatedContext("tech-1", { role: "technician" }).firestore()
  await assertSucceeds(getDoc(doc(db, "users", "tech-1")))
  await assertFails(updateDoc(doc(db, "users", "tech-1"), { role: "admin" }))
})

test("technicians can update telemetry but not approval state", async () => {
  const db = environment.authenticatedContext("tech-1", { role: "technician" }).firestore()
  await assertSucceeds(updateDoc(doc(db, "technicians", "tech-1"), {
    latitude: 25.2048,
    longitude: 55.2708,
    isOnline: true,
  }))
  await assertFails(updateDoc(doc(db, "technicians", "tech-1"), { isApproved: false }))
})

test("technicians can only mark their own notifications as read", async () => {
  const db = environment.authenticatedContext("tech-1", { role: "technician" }).firestore()
  await assertSucceeds(updateDoc(doc(db, "notifications", "notice-1"), { isRead: true }))
  await assertFails(updateDoc(doc(db, "notifications", "notice-1"), { isRead: false, userId: "other" }))
})

test("authenticated non-admin users cannot write arbitrary collections", async () => {
  const db = environment.authenticatedContext("tech-1", { role: "technician" }).firestore()
  await assertFails(setDoc(doc(db, "internal_settings", "site"), { enabled: true }))
})

test("verified admin claims retain administrative access", async () => {
  const db = environment.authenticatedContext("admin-1", { role: "admin" }).firestore()
  await assertSucceeds(setDoc(doc(db, "internal_settings", "site"), { enabled: true }))
  const snapshot = await assertSucceeds(getDoc(doc(db, "internal_settings", "site")))
  assert.equal(snapshot.data().enabled, true)
})
