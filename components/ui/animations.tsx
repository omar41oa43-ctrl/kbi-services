"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

// 1. Page Entrance Animation
interface PageEntranceProps extends HTMLMotionProps<"div"> {
  children: ReactNode
}

export function PageEntrance({ children, className, ...props }: PageEntranceProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 2. Section Title Animation
interface FadeInProps extends HTMLMotionProps<"div"> {
  children: ReactNode
  delay?: number
}

export function FadeIn({ children, className, delay = 0, ...props }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 3. Stagger Container for Cards
interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  children: ReactNode
  delay?: number
}

export function StaggerContainer({ children, className, delay = 0, ...props }: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.2,
            delayChildren: delay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 4. Stagger Item (Card)
interface StaggerItemProps extends HTMLMotionProps<"div"> {
  children: ReactNode
}

export function StaggerItem({ children, className, ...props }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      }}
      whileHover={{ 
        y: -5, 
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
        transition: { duration: 0.2 } 
      }}
      className={cn("h-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Since we often wrap existing buttons or <a> tags, we might just want a wrapper or a HOC.
// However, for simplicity, let's provide a motion wrapper for any element.
export function HoverScale({ children, className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn("inline-block", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
