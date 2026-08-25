"use client"

import * as React from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  User,
  LogOut,
  Wrench
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { auth, isMockMode } from "@/firebase/firebaseConfig"
import { signOut } from "firebase/auth"
import { useT } from "@/components/language-provider"

const navItems = [
  {
    title: "Dashboard",
    url: "/technician/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Assigned Orders",
    url: "/technician/orders",
    icon: ShoppingCart,
  },
  {
    title: "Profile",
    url: "/technician/profile",
    icon: User,
  },
]

export function TechnicianSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useT()

  const handleLogout = async () => {
    if (isMockMode) {
      localStorage.removeItem("mock_tech_user")
      router.push("/technician/login")
      return
    }
    await signOut(auth)
    router.push("/technician/login")
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="relative p-2">
          <div className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-cyan-500 text-sidebar-primary-foreground ring-1 ring-white/20 shadow-[0_8px_24px_-10px_rgba(6,182,212,0.45)]">
              <Wrench className="w-5 h-5 text-black" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight text-gray-300">
              <span className="truncate font-semibold">{t("Technician Portal")}</span>
              <span className="truncate text-xs">KBI Repairs</span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400">{t("Menu")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2.5">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.title)}
                    className="text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-300 ease-out px-3 py-2.5 gap-3 rounded-md data-[active=true]:bg-cyan-500/10 data-[active=true]:text-white data-[active=true]:border-l-2 data-[active=true]:border-cyan-500 shadow-none"
                  >
                    <Link href={item.url} className="flex items-center">
                      <item.icon className="w-4 h-4" />
                      <span className="font-semibold tracking-wide text-[14px] md:text-[15px]">{t(item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="bg-white/10" />
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("Log out")}
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
