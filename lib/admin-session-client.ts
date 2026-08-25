export async function establishAdminSession(idToken: string) {
  const response = await fetch("/api/admin/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
  })
  if (!response.ok) throw new Error("Unable to create the secure admin session.")
}

export async function clearAdminSession() {
  await fetch("/api/admin/session", { method: "DELETE" })
}
