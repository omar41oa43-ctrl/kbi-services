import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageEntranceProps extends ComponentProps<"div"> {
  children: ReactNode
}

export function PageEntrance({ children, className, ...props }: PageEntranceProps) {
  return (
    <div
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}

interface FadeInProps extends ComponentProps<"div"> {
  children: ReactNode
  delay?: number
}

export function FadeIn({ children, className, delay: _delay = 0, ...props }: FadeInProps) {
  return (
    <div
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}

interface StaggerContainerProps extends ComponentProps<"div"> {
  children: ReactNode
  delay?: number
}

export function StaggerContainer({ children, className, delay: _delay = 0, ...props }: StaggerContainerProps) {
  return (
    <div
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}

interface StaggerItemProps extends ComponentProps<"div"> {
  children: ReactNode
}

export function StaggerItem({ children, className, ...props }: StaggerItemProps) {
  return (
    <div
      className={cn("h-full", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function HoverScale({ children, className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("inline-block", className)}
      {...props}
    >
      {children}
    </div>
  )
}
