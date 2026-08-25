"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, ChevronDown, X, Search } from "lucide-react"

type MultiItem = {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
  disabled?: boolean
}

type AppMultiSelectProps = {
  items: MultiItem[]
  selected: string[]
  onChange: (_values: string[]) => void
  placeholder?: string
  className?: string
  contentClassName?: string
  helperText?: string
  error?: string
  disabled?: boolean
  clearAllLabel?: string
  searchThreshold?: number
  searchPlaceholder?: string
}

export function AppMultiSelect({
  items,
  selected,
  onChange,
  placeholder = "Select options",
  className,
  contentClassName,
  helperText,
  error,
  disabled,
  clearAllLabel = "Clear all",
  searchThreshold = 8,
  searchPlaceholder = "Search…",
}: AppMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const showSearch = items.length > searchThreshold

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

  const toggle = (v: string) => {
    const has = selected.includes(v)
    if (has) onChange(selected.filter((s) => s !== v))
    else onChange([...selected, v])
  }

  const clearAll = () => onChange([])

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={disabled}
            variant="outline"
            className={cn(
              "w-full justify-between bg-white/5 border-white/10 text-white h-10 px-2 rounded-xl hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40",
              error && "border-red-500/50",
              className
            )}
          >
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
              {selected.length === 0 ? (
                <span className="text-white/50 text-sm">{placeholder}</span>
              ) : (
                selected.map((val) => {
                  const it = items.find((i) => i.value === val)
                  const label = it?.label || val
                  return (
                    <span key={val} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 text-xs">
                      {label}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggle(val)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            e.stopPropagation()
                            toggle(val)
                          }
                        }}
                        className="ml-1 text-cyan-200/70 hover:text-cyan-100 cursor-pointer"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </span>
                  )
                })
              )}
            </div>
            <div className="flex items-center gap-2">
              {selected.length > 0 && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    clearAll()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      e.stopPropagation()
                      clearAll()
                    }
                  }}
                  className="text-[11px] text-white/60 hover:text-white/80 cursor-pointer"
                  aria-label={clearAllLabel}
                >
                  {clearAllLabel}
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-white/60" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn(
            "w-[var(--radix-popover-trigger-width)] bg-zinc-900 border-white/10 text-white p-0 rounded-xl shadow-lg",
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
                  className="pl-8 bg-white/5 border-white/10 text-white h-10 rounded-lg"
                />
              </div>
            </div>
          )}
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-white/50">No results</div>
            ) : (
              filtered.map((it) => {
                const active = selected.includes(it.value)
                return (
                  <button
                    key={it.value}
                    type="button"
                    disabled={it.disabled}
                    onClick={() => toggle(it.value)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-sm text-sm flex items-start gap-2 hover:bg-white/5",
                      active && "bg-cyan-500/10"
                    )}
                  >
                    {active ? <Check className="h-4 w-4 text-cyan-400 mt-0.5" /> : <span className="h-4 w-4 mt-0.5" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {it.icon ? <span className="mt-0.5">{it.icon}</span> : null}
                        <span>{it.label}</span>
                      </div>
                      {it.description ? (
                        <div className="text-[11px] text-white/50 pl-6">{it.description}</div>
                      ) : null}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error ? (
        <div className="mt-1 text-[12px] text-red-400">{error}</div>
      ) : helperText ? (
        <div className="mt-1 text-[12px] text-white/40">{helperText}</div>
      ) : null}
    </div>
  )
}
