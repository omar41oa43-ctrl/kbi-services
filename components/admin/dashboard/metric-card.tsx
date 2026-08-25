import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const tones = {
  amber: "border-amber-400/20 bg-amber-400/[0.04] text-amber-300",
  cyan: "border-cyan-400/20 bg-cyan-400/[0.04] text-cyan-300",
  emerald: "border-emerald-400/20 bg-emerald-400/[0.04] text-emerald-300",
  violet: "border-violet-400/20 bg-violet-400/[0.04] text-violet-300",
} as const

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  detail: string
  icon: LucideIcon
  tone: keyof typeof tones
}) {
  return (
    <section className={cn("rounded-2xl border p-5", tones[tone])} aria-label={label}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-white/60">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-xl border border-current/15 bg-current/[0.06]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-white/40">{detail}</p>
    </section>
  )
}
