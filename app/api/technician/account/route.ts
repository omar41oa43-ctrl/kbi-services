import { NextResponse } from "next/server"

import { authenticateTechnician } from "@/lib/api-auth"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"

export async function DELETE(request: Request) {
  const identity = await authenticateTechnician(request)
  if (!identity) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  const db = getAdminDb()
  try {
    const documents = ["users", "technicians", "technician_requests", "activation_requests"]
      .map((collection) => db.collection(collection).doc(identity.uid))
    await Promise.all(documents.map((document) => db.recursiveDelete(document)))
    await getAdminAuth().deleteUser(identity.uid)
    return NextResponse.json({ success: true, deleted: true })
  } catch (error) {
    console.error("Technician account deletion error:", error)
    return NextResponse.json({ success: false, error: "Unable to delete the account" }, { status: 500 })
  }
}
