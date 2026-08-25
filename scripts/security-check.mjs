import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const failures = []

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8")
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolute = path.join(directory, entry.name)
  return entry.isDirectory() ? walk(absolute) : [absolute]
})

const assertContains = (relativePath, patterns, label) => {
  const source = read(relativePath)
  if (!patterns.some((pattern) => source.includes(pattern))) {
    failures.push(`${relativePath}: ${label}`)
  }
}

const apiRoot = path.join(root, "app", "api")
for (const absolute of walk(apiRoot).filter((file) => file.endsWith(`${path.sep}route.ts`))) {
  const relative = path.relative(root, absolute).replaceAll("\\", "/")
  if (relative.startsWith("app/api/admin/") && relative !== "app/api/admin/reset/request/route.ts") {
    assertContains(relative, ["authenticateAdmin(", "verifyAdmin("], "admin route has no server-side admin check")
  }
  if (relative.startsWith("app/api/technician/")) {
    assertContains(relative, ["authenticateTechnician("], "technician route has no server-side technician check")
  }
  if (relative.startsWith("app/api/customer/")) {
    assertContains(relative, ["authenticateCustomer("], "customer route has no server-side customer check")
  }
}

const actionRoot = path.join(root, "app", "actions")
for (const absolute of walk(actionRoot).filter((file) => /^admin-.*\.ts$/.test(path.basename(file)))) {
  const relative = path.relative(root, absolute).replaceAll("\\", "/")
  assertContains(
    relative,
    ["verifyAdmin(", "verifyIdentity(", "getAdminAuth().verifyIdToken("],
    "admin server action has no verified identity check",
  )
}

const sourceRoots = [
  "app",
  "components",
  "lib",
  "proxy.ts",
  "scripts/auth-user-tool.mjs",
  "scripts/create-tech-user.js",
  "scripts/create-tech.mjs",
  "scripts/create-sample-job.mjs",
  "scripts/reseed-admin.js",
  "scripts/reset-admin.mjs",
  "scripts/reset-users.js",
].filter((entry) => fs.existsSync(path.join(root, entry)))
const sourceFiles = sourceRoots.flatMap((entry) => {
  const absolute = path.join(root, entry)
  return fs.statSync(absolute).isDirectory() ? walk(absolute) : [absolute]
}).filter((file) => /\.(?:ts|tsx|js|mjs)$/.test(file) && !file.includes(`${path.sep}generated${path.sep}`))

const forbidden = [
  "default_master_admin_token",
  "AdminPassword2026!",
  "AdminPassword123!",
  "password123",
  "123q123q",
  "mockTechnicianId",
  "mockUserId",
  "NEXT_PUBLIC_MASTER_ADMIN_EMAILS",
  "NEXT_PUBLIC_MASTER_ADMIN_UID",
]

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8")
  for (const marker of forbidden) {
    if (source.includes(marker)) {
      failures.push(`${path.relative(root, file)}: forbidden security marker ${marker}`)
    }
  }
}

if (failures.length) {
  console.error(`Security check failed (${failures.length}):`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log("Security check passed: protected API routes and known backdoors verified.")
