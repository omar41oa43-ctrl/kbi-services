/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['firebase-admin', 'jwks-rsa', 'jose'],
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/v1/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  generateBuildId: async () => {
    return `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  async redirects() {
    return [
      ['mobile', 'mobile-phone-repair'],
      ['laptop', 'laptop-repair'],
      ['pc', 'computer-repair'],
      ['printer', 'printer-repair'],
      ['tv', 'tv-repair'],
      ['monitor', 'monitor-repair'],
      ['tablet', 'tablet-repair'],
      ['apple-watch', 'apple-watch-repair'],
      ['gaming', 'gaming-console-repair'],
      ['networking', 'network-support'],
      ['tech-support', 'it-support'],
      ['tv-install', 'tv-installation'],
    ].map(([source, destination]) => ({
      source: `/services/${source}`,
      destination: `/services/${destination}`,
      permanent: true,
    }))
  },
  async headers() {
    const noStore = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    const swCache = 'public, max-age=0, must-revalidate'
    
    // Keep local-network previews on HTTP, while enforcing HTTPS upgrades on
    // the public domains below. This lets real iOS devices load local assets.
    const cspHeader = `
      default-src 'self' https:;
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googletagmanager.com https://identitytoolkit.googleapis.com https://unpkg.com;
      connect-src 'self' https: wss: https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://ipwho.is https://api.qrserver.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://server.arcgisonline.com;
      img-src 'self' data: blob: https: https://*.openstreetmap.org https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://server.arcgisonline.com https://*.arcgisonline.com https://*.unsplash.com https://firebasestorage.googleapis.com https://api.qrserver.com https://www.googletagmanager.com https://*.google-analytics.com https://*.doubleclick.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' data: https://fonts.gstatic.com;
      frame-src 'self' https://*.firebaseapp.com https://*.web.app;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim()
    const productionCspHeader = `${cspHeader} upgrade-insecure-requests;`
    const productionSecurityHeaders = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Content-Security-Policy', value: productionCspHeader },
    ]

    return [
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: noStore },
          { key: 'CDN-Cache-Control', value: noStore },
          { key: 'Vercel-CDN-Cache-Control', value: noStore },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
        ],
      },
      {
        source: '/admin',
        headers: [
          { key: 'Cache-Control', value: noStore },
          { key: 'CDN-Cache-Control', value: noStore },
          { key: 'Vercel-CDN-Cache-Control', value: noStore },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: noStore },
          { key: 'CDN-Cache-Control', value: noStore },
          { key: 'Vercel-CDN-Cache-Control', value: noStore },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
          { key: 'Content-Security-Policy', value: cspHeader },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
          { key: 'CDN-Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
          { key: 'Vercel-CDN-Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/admin-sw.js',
        headers: [
          { key: 'Cache-Control', value: swCache },
          { key: 'CDN-Cache-Control', value: swCache },
          { key: 'Vercel-CDN-Cache-Control', value: swCache },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'kbi.services' }],
        headers: productionSecurityHeaders,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.kbi.services' }],
        headers: productionSecurityHeaders,
      },
    ]
  },
}

export default nextConfig
