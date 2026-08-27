export default function SiteLoading() {
  return (
    <div
      className="min-h-[70svh] px-5 pb-20 pt-28 sm:px-6 sm:pt-32"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="mx-auto w-full max-w-5xl space-y-7">
        <div className="h-4 w-28 rounded-full bg-cyan-500/20" />
        <div className="space-y-4">
          <div className="h-10 w-[82%] max-w-xl rounded-2xl bg-muted" />
          <div className="h-4 w-full max-w-2xl rounded-full bg-muted/80" />
          <div className="h-4 w-[68%] max-w-lg rounded-full bg-muted/70" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-36 rounded-3xl border border-border bg-card shadow-sm"
            />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  )
}
