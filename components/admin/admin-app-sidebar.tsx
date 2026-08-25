"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/language-provider"
import { auth, isMockMode } from "@/firebase/authClient"
import { signOut } from "firebase/auth"

function IconDashboard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  )
}
function IconCart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 4h2l3 12h9l2-7H6" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  )
}
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="11" r="3" />
      <path d="M2 20c0-3.5 3.5-6 7-6" />
      <path d="M12 20c0-2.8 2.4-5 5.5-5" />
    </svg>
  )
}
function IconPhone(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <circle cx="12" cy="18" r="1" />
    </svg>
  )
}
function IconSettings(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 12a7.4 7.4 0 0 0-.2-1.5l2.1-1.6-2-3.5-2.5.7a7.4 7.4 0 0 0-2.6-1.5L12 2l-2.2 1.1a7.4 7.4 0 0 0-2.6 1.5l-2.5-.7-2 3.5 2.1 1.6a7.4 7.4 0 0 0 0 3l-2.1 1.6 2 3.5 2.5-.7a7.4 7.4 0 0 0 2.6 1.5L12 22l2.2-1.1a7.4 7.4 0 0 0 2.6-1.5l2.5.7 2-3.5-2.1-1.6c.1-.5.2-1 .2-1.5Z" />
    </svg>
  )
}
function IconShield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4Z" />
      <path d="M9.5 12.5l1.7 1.7L14.8 10.6" />
    </svg>
  )
}
function IconLogout(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}
function IconBriefcase(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  )
}
function IconClipboard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M8 10h8M8 14h8" />
    </svg>
  )
}

const navItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: IconDashboard,
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: IconCart,
  },
  {
    title: "Service Requests",
    url: "/admin/service-requests",
    icon: IconClipboard,
  },
  {
    title: "Technicians",
    url: "/admin/technicians",
    icon: IconUsers,
  },
  {
    title: "Subscriptions",
    url: "/admin/subscriptions",
    icon: IconBriefcase,
  },
  {
    title: "Inventory",
    url: "/admin/inventory",
    icon: IconPhone,
  },
]

const inboxItems = [
  {
    title: "Corporate Requests",
    url: "/admin/inbox/corporate",
    icon: IconBriefcase,
  },
]

const settingsItems = [
  {
    title: "Settings",
    url: "/admin/settings",
    icon: IconSettings,
  },
  {
    title: "Security Settings",
    url: "/admin/settings/security",
    icon: IconShield,
  },
]

export function AdminAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useT()
  const [userEmail, setUserEmail] = React.useState<string | null>(null)

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserEmail(u?.email ?? null)
    })
    return () => unsub()
  }, [])

  const handleLogout = async () => {
    if (isMockMode) {
      localStorage.removeItem("mock_admin_user")
      router.replace("/admin/login")
      return
    }
    await signOut(auth)
    router.replace("/admin/login")
  }

  return (
    <Sidebar
      collapsible="icon"
      className="bg-black/70 border-r border-white/10 backdrop-blur-xl shadow-[0_20px_50px_-35px_rgba(6,182,212,0.5)]"
      {...props}
    >
      <SidebarHeader className="border-b border-white/10">
        <div className="flex items-center gap-3 p-3">
          <div className="relative flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-br from-black via-black to-[#0b1a1f] text-sidebar-primary-foreground shadow-[0_18px_40px_-22px_rgba(6,182,212,0.75)] overflow-hidden ring-1 ring-white/10">
            <div className="absolute -inset-px bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-70" />
            <div className="absolute inset-0 bg-[radial-gradient(90%_90%_at_50%_60%,rgba(255,255,255,0.18),rgba(255,255,255,0)_62%)]" />
            <div className="absolute -left-4 top-0 h-16 w-10 rotate-[20deg] bg-gradient-to-b from-white/18 via-white/8 to-transparent blur-[0.5px] opacity-60" />
            <span className="relative font-extrabold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
              KBI<span className="text-cyan-400">.</span>
            </span>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-white">{t("Admin Panel")}</span>
            <span className="truncate text-xs text-white/50">{t("Repair Operations Hub")}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] tracking-[0.2em] uppercase text-white/40">{t("Management")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.title)}
                    className="h-10 rounded-xl px-3 text-white/70 hover:text-white hover:bg-white/5 data-[active=true]:bg-gradient-to-r data-[active=true]:from-cyan-500/20 data-[active=true]:to-blue-500/20 data-[active=true]:text-white data-[active=true]:shadow-[0_12px_30px_-20px_rgba(6,182,212,0.7)]"
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{t(item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] tracking-[0.2em] uppercase text-white/40">{t("Inbox")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {inboxItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.title)}
                    className="h-10 rounded-xl px-3 text-white/70 hover:text-white hover:bg-white/5 data-[active=true]:bg-gradient-to-r data-[active=true]:from-purple-500/20 data-[active=true]:to-pink-500/20 data-[active=true]:text-white data-[active=true]:shadow-[0_12px_30px_-20px_rgba(236,72,153,0.65)]"
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{t(item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] tracking-[0.2em] uppercase text-white/40">{t("Configuration")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.title)}
                    className="h-10 rounded-xl px-3 text-white/70 hover:text-white hover:bg-white/5 data-[active=true]:bg-gradient-to-r data-[active=true]:from-emerald-500/20 data-[active=true]:to-cyan-500/20 data-[active=true]:text-white data-[active=true]:shadow-[0_12px_30px_-20px_rgba(16,185,129,0.6)]"
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{t(item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
             <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <Avatar className="h-9 w-9 rounded-xl">
                  <AvatarImage src="/placeholder-user.jpg" alt="Admin" />
                  <AvatarFallback className="rounded-xl">AD</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-white">{t("Admin User")}</span>
                  <span className="truncate text-xs text-white/50">{userEmail ?? "admin@kbi.ae"}</span>
                </div>
                <Button variant="ghost" size="icon-sm" className="ml-auto hover:bg-white/10" onClick={handleLogout} aria-label="Log out">
                  <IconLogout className="size-4" />
                </Button>
             </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
