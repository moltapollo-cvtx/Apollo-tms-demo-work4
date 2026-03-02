"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  House,
  Radio,
  ClipboardText,
  UsersThree,
  Truck,
  Buildings,
  Receipt,
  ShieldCheck,
  FileText,
  ChartBar,
  Plug,
  Gear,
  CaretLeft,
  CaretRight,
  Brain,
  MapTrifold,
  Monitor,
  GasPump,
  Timer,
  Calculator,
  ChartLineUp,
} from "@phosphor-icons/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserRole } from "@/types";

// Sidebar navigation grouped by workflow
const navSections = [
  {
    label: null, // No label for top section
    items: [
      { name: "Dashboard", href: "/", icon: House, roles: ["admin", "dispatcher", "driver_manager", "safety_manager", "accounting", "driver"] },
      { name: "AI Command", href: "/ai", icon: Brain, roles: ["admin", "dispatcher", "driver_manager", "safety_manager", "accounting", "driver"], premium: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Dispatch", href: "/dispatch", icon: Radio, roles: ["admin", "dispatcher", "driver_manager"] },
      { name: "Orders", href: "/orders", icon: ClipboardText, roles: ["admin", "dispatcher", "driver_manager", "accounting"] },
      { name: "Fleet Map", href: "/fleet-map", icon: MapTrifold, roles: ["admin", "dispatcher", "driver_manager", "safety_manager"], premium: true },
    ],
  },
  {
    label: "Fleet",
    items: [
      { name: "Drivers", href: "/drivers", icon: UsersThree, roles: ["admin", "dispatcher", "driver_manager", "safety_manager"] },
      { name: "Equipment", href: "/equipment", icon: Truck, roles: ["admin", "dispatcher", "driver_manager", "safety_manager"] },
      { name: "Safety", href: "/safety", icon: ShieldCheck, roles: ["admin", "driver_manager", "safety_manager"] },
    ],
  },
  {
    label: "Business",
    items: [
      { name: "Customers", href: "/customers", icon: Buildings, roles: ["admin", "dispatcher", "accounting"] },
      { name: "Billing", href: "/billing", icon: Receipt, roles: ["admin", "accounting"] },
      { name: "Portal Preview", href: "/portal-preview", icon: Monitor, roles: ["admin", "accounting"], premium: true },
      { name: "Analytics", href: "/analytics", icon: ChartBar, roles: ["admin", "dispatcher", "driver_manager", "safety_manager", "accounting"] },
      { name: "IFTA", href: "/ifta", icon: Calculator, roles: ["admin", "dispatcher", "driver_manager", "safety_manager", "accounting", "driver"] },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Documents", href: "/documents", icon: FileText, roles: ["admin", "dispatcher", "safety_manager", "accounting"] },
      { name: "Integrations", href: "/integrations", icon: Plug, roles: ["admin", "dispatcher", "driver_manager", "safety_manager", "accounting"] },
      { name: "Reports", href: "/reports", icon: ChartLineUp, roles: ["admin", "dispatcher", "driver_manager", "safety_manager", "accounting", "driver"] },
      { name: "Settings", href: "/settings", icon: Gear, roles: ["admin"] },
    ],
  },
];

// Flat list for backward compatibility
const allNavigation = navSections.flatMap(s => s.items);

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Filter navigation items based on user role (show all for demo/no-auth)
  const userRole = (session?.user?.role as UserRole) || "admin";
  const _navigation = useMemo(() => {
    return allNavigation.filter(item =>
      item.roles.includes(userRole)
    );
  }, [userRole]);

  const handleMobileItemClick = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-[72px] items-center gap-3 border-b border-border/70 bg-gradient-to-r from-white/80 to-apollo-cyan-50/40 px-4">
        <motion.div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-apollo-cyan-400 to-apollo-cyan-600 text-white"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <span className="font-mono text-sm font-bold">A</span>
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="text-base font-semibold tracking-tight text-apollo-cyan-600 whitespace-nowrap"
            >
              Apollo TMS
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="ml-auto flex items-center gap-1.5 rounded-full border border-apollo-cyan-200 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-apollo-cyan-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-apollo-cyan-500" />
              Live
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        {navSections.map((section, sectionIndex) => {
          const sectionRole = (session?.user?.role as UserRole) || "admin";
          const sectionItems = section.items.filter(item => item.roles.includes(sectionRole));
          if (sectionItems.length === 0) return null;

          return (
            <div key={section.label ?? "top"} className={cn(sectionIndex > 0 && "mt-4 pt-3 border-t border-border/50")}>
              <AnimatePresence>
                {section.label && !collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55"
                  >
                    {section.label}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-1">
                {sectionItems.map((item, index) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  const link = (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: (sectionIndex * 3 + index) * 0.04,
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        href={item.href}
                        onClick={handleMobileItemClick}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                          isActive
                            ? "border-primary/25 bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm"
                            : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-white/75 hover:text-accent-foreground hover:shadow-sm"
                        )}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={`Navigate to ${item.name}`}
                      >
                        {isActive && (
                          <span className="absolute left-1.5 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-primary" />
                        )}
                        <motion.div
                          whileHover={{ rotate: isActive ? 0 : 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                            isActive
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border/60 bg-white text-muted-foreground"
                          )}
                        >
                          <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                        </motion.div>
                        <AnimatePresence>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              className="whitespace-nowrap"
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {"premium" in item && item.premium && !collapsed && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="ml-auto rounded-full border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary"
                          >
                            AI
                          </motion.span>
                        )}
                      </Link>
                    </motion.div>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.name} delayDuration={0}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return link;
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle - only visible on desktop */}
      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-4 top-20 z-50 hidden h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-white/95 text-muted-foreground shadow-md backdrop-blur-lg transition-colors hover:text-foreground lg:flex"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <CaretRight className="h-4 w-4" />
        ) : (
          <CaretLeft className="h-4 w-4" />
        )}
      </motion.button>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className={cn(
          "relative z-30 hidden h-[100dvh] flex-col overflow-visible border-r border-border/80 bg-[linear-gradient(180deg,#f8fdff_0%,#f2f8fb_100%)] sticky top-0 lg:flex",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="pointer-events-none absolute -right-10 top-10 h-40 w-40 rounded-full bg-apollo-cyan-100/50 blur-3xl" />
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  onMobileClose?.();
                }
              }}
              className="fixed inset-0 z-40 bg-zinc-950/50 backdrop-blur-sm lg:hidden"
              role="button"
              tabIndex={-1}
              aria-label="Close navigation menu"
            />

            {/* Mobile Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-border lg:hidden focus:outline-none overflow-hidden flex flex-col"
              role="navigation"
              aria-label="Main navigation menu"
              aria-hidden={!isMobileOpen}
              tabIndex={-1}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
