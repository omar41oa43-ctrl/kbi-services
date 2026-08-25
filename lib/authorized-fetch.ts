"use client"

import { auth } from "@/firebase/authClient"

export async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const user = auth.currentUser
  if (!user) throw new Error("Authentication required")

  const token = await user.getIdToken()
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${token}`)

  return fetch(input, { ...init, headers })
}
