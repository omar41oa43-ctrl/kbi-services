"use client"

import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, Info } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type AppSelectItem = {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
  disabled?: boolean
  disabledReason?: string
}

type AppSelectProps = {
  items: AppSelectItem[]
  value?: string
  onValueChange?: (_v: string) => void
  placeholder?: string
  size?: "sm" | "default"
  className?: string
  contentClassName?: string
  helperText?: string
  error?: string
  disabled?: boolean
  disabledReason?: string
  persistKey?: string
  syncWithQueryKey?: string
  searchThreshold?: number
  searchPlaceholder?: string
}

export function AppSelect({
  items = [],
  value,
  onValueChange,
  placeholder = "Select option",
  size = "default",
  className,
  contentClassName,
  helperText,
  error,
  disabled,
  disabledReason,
  persistKey,
  syncWithQueryKey,
  searchThreshold = 8,
  searchPlaceholder = "Search…",
}: AppSelectProps) {
  const [query, setQuery] = React.useState("")
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const showSearch = items.length > searchThreshold

  React.useEffect(() => {
    if (!persistKey || value !== undefined) return
    try {
      const stored = window.localStorage.getItem(persistKey)
      if (stored && onValueChange) onValueChange(stored)
    } catch {}
  }, [persistKey, onValueChange, value])

  const handleChange = (v: string) => {
    onValueChange?.(v)
    if (persistKey) {
      try {
        window.localStorage.setItem(persistKey, v)
      } catch {}
    }
    if (syncWithQueryKey) {
      const p = new URLSearchParams(params.toString())
      p.set(syncWithQueryKey, v)
      router.replace(`${pathname}?${p.toString()}`)
    }
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => {
      const label = it.label.toLowerCase()
      const desc = (it.description || "").toLowerCase()
      const val = it.value.toLowerCase()
      return label.includes(q) || desc.includes(q) || val.includes(q)
    })
  }, [items, query])

  return (
    <div className="w-full">
      <Select value={value} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger
          data-disabled={disabled ? true : undefined}
          title={disabled ? disabledReason || "" : undefined}
          size={size}
          className={cn(
            "bg-white/5 border-white/10 text-white focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 data-[disabled]:opacity-60 data-[disabled]:cursor-not-allowed h-9",
            error && "border-red-500/50 focus-visible:ring-red-500/30",
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          className={cn(
            "bg-zinc-900 border-white/10 text-white max-h-[300px] overflow-y-auto scroll-smooth",
            contentClassName
          )}
        >
          {showSearch && (
            <div className="sticky top-0 z-10 p-2 border-b border-white/10 bg-zinc-900">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/40" />
                <Input
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8 bg-white/5 border-white/10 text-white h-9"
                />
              </div>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-white/50">No results</div>
          ) : (
            filtered.map((it) => (
              <SelectItem
                key={it.value}
                value={it.value}
                disabled={it.disabled}
                title={it.disabled ? it.disabledReason || "" : undefined}
                className="data-[state=checked]:bg-cyan-500/10 data-[state=checked]:text-white"
              >
                <div className="flex items-start gap-2">
                  {it.icon ? <span className="mt-0.5">{it.icon}</span> : null}
                  <span className="flex-1">
                    <span className="text-sm">{it.label}</span>
                    {it.description ? (
                      <span className="block text-[11px] text-white/50">{it.description}</span>
                    ) : null}
                  </span>
                  {it.disabled && it.disabledReason ? (
                    <span className="flex items-center gap-1 text-[10px] text-white/40">
                      <Info className="h-3 w-3" /> {it.disabledReason}
                    </span>
                  ) : null}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error ? (
        <div className="mt-1 text-[12px] text-red-400">{error}</div>
      ) : helperText ? (
        <div className="mt-1 text-[12px] text-white/40">{helperText}</div>
      ) : null}
    </div>
  )
}
