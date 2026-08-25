import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://example-dsn@sentry.io/example",
  tracesSampleRate: 0.1,
  debug: false,
})
