import { cn } from "@/lib/utils"
import type React from "react"

type GlassCardProps = React.ComponentProps<"div"> & {
  hoverEffect?: boolean
  as?: "div" | "button" | "section"
}

export function GlassCard({ children, className, hoverEffect = true, as: Component = "div", ...props }: GlassCardProps) {
  return (
    <Component
      className={cn(
        "glass rounded-3xl p-6 sm:p-8 lg:p-10 relative overflow-hidden group transition-transform duration-300",
        hoverEffect && "glass-hover hover:-translate-y-1 hover:shadow-2xl",
        className
      )}
      {...(props as any)}
    >
      {children}
    </Component>
  )
}
