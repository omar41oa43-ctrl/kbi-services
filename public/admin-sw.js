const BUILD_ID = "build-v2"
const CACHE_NAME = `kbi-admin-shell-${BUILD_ID}`
const OFFLINE_URL = "/offline"

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)).catch(() => undefined)
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME && cacheName.startsWith("kbi-admin-shell-")
        }).map((cacheName) => {
          console.log(`[SW] Deleting old cache: ${cacheName}`)
          return caches.delete(cacheName)
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (!url.pathname.startsWith("/admin")) return

  event.respondWith(
    fetch(request).catch(async () => {
      const cachedOffline = await caches.match(OFFLINE_URL)
      return cachedOffline || Response.error()
    })
  )
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
