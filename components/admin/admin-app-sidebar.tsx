"use client";

import * as React from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Boxes,
  Building2,
  ChartNoAxesCombined,
  ChevronsUpDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { useT } from "@/components/language-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { auth } from "@/firebase/authClient";
import { clearAdminSession } from "@/lib/admin-session-client";

const navigation = [
  {
    label: "OPERATIONS",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Orders", url: "/admin/orders", icon: ClipboardList },
      { title: "Live Tracking", url: "/admin/tracking", icon: MapPin },
    ],
  },
  {
    label: "WORKFORCE",
    items: [
      { title: "Technicians", url: "/admin/technicians", icon: Users },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { title: "Inventory", url: "/admin/inventory", icon: Boxes },
      { title: "Corporate Requests", url: "/admin/inbox/corporate", icon: Building2 },
      { title: "Analytics", url: "/admin/analytics", icon: ChartNoAxesCombined },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { title: "Settings", url: "/admin/settings", icon: Settings },
      { title: "Security", url: "/admin/settings/security", icon: ShieldCheck },
    ],
  },
];

const isCurrentRoute = (pathname: string, url: string) => {
  if (url === "/admin") return pathname === url;
  if (url === "/admin/settings") return pathname === url;
  return pathname === url || pathname.startsWith(`${url}/`);
};

export function AdminAppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => onAuthStateChanged(auth, (user) => setUserEmail(user?.email ?? null)), []);

  React.useEffect(() => {
    const adminRoutes = [
      "/admin",
      "/admin/orders",
      "/admin/tracking",
      "/admin/technicians",
      "/admin/inventory",
      "/admin/inbox/corporate",
      "/admin/analytics",
      "/admin/settings",
      "/admin/settings/security",
    ];
    const prefetchRoutes = () => {
      adminRoutes.forEach((route) => {
        try {
          router.prefetch(route);
        } catch {}
      });
    };
    const timer = setTimeout(prefetchRoutes, 100);
    return () => clearTimeout(timer);
  }, [router]);

  const handleLogout = async () => {
    await clearAdminSession();
    await signOut(auth);
    router.replace("/admin/login");
  };

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="border-transparent bg-transparent text-sidebar-foreground transition-colors duration-200 [&_[data-slot=sidebar-inner]]:m-3 [&_[data-slot=sidebar-inner]]:mr-2 [&_[data-slot=sidebar-inner]]:rounded-[24px] [&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-white/75 [&_[data-slot=sidebar-inner]]:bg-white/65 [&_[data-slot=sidebar-inner]]:shadow-[0_24px_70px_rgba(44,75,116,.1)] [&_[data-slot=sidebar-inner]]:backdrop-blur-3xl dark:[&_[data-slot=sidebar-inner]]:border-white/10 dark:[&_[data-slot=sidebar-inner]]:bg-slate-950/55"
      {...props}
    >
      {/* Brand Header */}
      <SidebarHeader className="p-4 pb-3">
        <Link
          href="/admin"
          className="flex items-center gap-3 p-1.5 rounded-2xl transition hover:bg-sidebar-accent/60"
        >
          <div className="flex aspect-square size-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-700 text-white font-extrabold text-sm tracking-tight shadow-[0_8px_20px_rgba(0,112,239,.24)] ring-1 ring-white/70">
            KBI.
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-bold text-[15px] tracking-tight text-sidebar-foreground">
              KBI Admin
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
                Live workspace
              </span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="px-3 py-2 space-y-5">
        {navigation.map((group) => (
          <SidebarGroup key={group.label} className="p-0">
            <SidebarGroupLabel className="px-3 py-1.5 text-[9px] font-bold tracking-[0.13em] text-muted-foreground uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
                  const active = isCurrentRoute(pathname, item.url);
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={`h-11 rounded-[14px] px-3 text-xs font-semibold transition-all duration-150 ${
                          active
                            ? "bg-blue-50/90 text-blue-700 border border-blue-200/70 shadow-[0_7px_20px_rgba(20,102,196,.08)] font-bold dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-400/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                        }`}
                      >
                        <Link href={item.url} className="flex items-center gap-3">
                          <Icon
                            className={`size-4 shrink-0 transition-colors ${
                              active
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="truncate">{t(item.title)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer / User Profile */}
      <SidebarFooter className="p-3 border-t border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-[18px] border border-white/80 bg-white/55 p-2.5 shadow-[0_8px_24px_rgba(47,76,112,.07)] hover:bg-white/80 transition dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <Avatar className="size-9 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center ring-2 ring-white/80 dark:ring-white/10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold">
                      {userEmail?.slice(0, 1).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-xs leading-tight ml-1">
                    <span className="truncate font-bold text-sidebar-foreground">
                      Administrator
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="truncate text-[10px] text-muted-foreground font-mono">
                        {userEmail || "admin@kbi.ae"}
                      </span>
                    </div>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1217] text-slate-900 dark:text-white shadow-xl"
                side="top"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="font-semibold text-xs">
                  {userEmail || "admin@kbi.ae"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <Settings className="size-4 text-slate-400" />
                    {t("Settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/settings/security"
                    className="flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <ShieldCheck className="size-4 text-slate-400" />
                    {t("Security")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 cursor-pointer focus:bg-rose-50 dark:focus:bg-rose-950/50"
                >
                  <LogOut className="size-4" />
                  {t("Sign out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
