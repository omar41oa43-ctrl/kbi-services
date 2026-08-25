import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function handleStaleServerActionError(error: unknown) {
  if (typeof window === "undefined") return false

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : (() => {
            try {
              return JSON.stringify(error)
            } catch {
              return String(error)
            }
          })()

  if (!message || !message.includes('Failed to find Server Action')) return false

  try {
    const key = "kbi_server_action_skew_reload_v1"
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, "1")
  } catch {}

  window.location.reload()
  return true
}
