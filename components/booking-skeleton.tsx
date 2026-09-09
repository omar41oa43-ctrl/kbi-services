export function BookingSkeleton({ arabic = false }: { arabic?: boolean }) {
  return (
    <div
      className="min-h-screen px-4 pb-24 pt-24 sm:px-6 sm:pt-28"
      role="status"
      aria-live="polite"
      aria-label={arabic ? "جارٍ تحميل نموذج الحجز" : "Loading booking form"}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mx-auto mb-8 max-w-md space-y-3 text-center">
          <div className="mx-auto h-7 w-44 rounded-full bg-cyan-500/15" />
          <div className="mx-auto h-10 w-64 max-w-full rounded-2xl bg-muted" />
          <div className="mx-auto h-4 w-80 max-w-full rounded-full bg-muted/70" />
        </div>
        <div className="mx-auto mb-8 grid max-w-xl grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-2">
          {[0, 1, 2].map((item) => <div key={item} className="h-10 rounded-xl bg-muted/70" />)}
        </div>
        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-xl sm:p-8">
          <div className="mb-6 h-7 w-52 rounded-xl bg-muted" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, item) => (
              <div key={item} className="h-24 rounded-2xl border border-border bg-muted/60" />
            ))}
          </div>
          <div className="mt-6 h-12 rounded-2xl bg-cyan-500/20" />
        </div>
      </div>
      <span className="sr-only">{arabic ? "جارٍ التحميل…" : "Loading…"}</span>
    </div>
  )
}
