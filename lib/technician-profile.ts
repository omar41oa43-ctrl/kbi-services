export function isTechnicianProfile(data: Record<string, unknown>) {
  const role = String(data.role || data.userRole || "").trim().toLowerCase()
  const email = String(data.email || "").trim().toLowerCase()
  const name = String(data.name || data.full_name || data.displayName || "").trim().toLowerCase()

  if (role === "admin" || role === "super_admin" || role === "master_admin") return false
  if (data.isAdmin === true || data.isSuperAdmin === true) return false
  if (email.startsWith("admin@")) return false
  if (name === "admin" || name === "admin user" || name === "super admin") return false
  return true
}
