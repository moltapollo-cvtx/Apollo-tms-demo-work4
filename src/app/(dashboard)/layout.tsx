"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SectionErrorBoundary } from "@/components/ui/error-boundary";
import { CommandPaletteProvider, CommandItem } from "@/components/ui/command-palette";
import { NotificationProvider } from "@/components/notifications/notification-context";
import { useRouter } from "next/navigation";
import { useOrders } from "@/lib/hooks/api/use-orders";
import { useDrivers } from "@/lib/hooks/api/use-drivers";
import { useCustomers } from "@/lib/hooks/api/use-customers";
import { useTractors, useTrailers } from "@/lib/hooks/api/use-equipment";
import {
  SquaresFour,
  MapPin,
  ClipboardText,
  UserCircle,
  Truck,
  Buildings,
  CurrencyDollar,
  ChartLineUp,
  ShieldCheck,
  FileText,
  Gear,
  FlowArrow,
  Plug,
} from "@phosphor-icons/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const router = useRouter();

  // Fetch data for search
  const { data: ordersData } = useOrders({
    pageSize: 50,
    include: ["customer"]
  });
  const { data: driversData } = useDrivers({
    pageSize: 50
  });
  const { data: customersData } = useCustomers({
    pageSize: 50
  });
  const { data: tractorsData } = useTractors({
    pageSize: 50
  });
  const { data: trailersData } = useTrailers({
    pageSize: 50
  });

  // Command palette items with dynamic data
  const commandItems: CommandItem[] = useMemo(() => {
    const staticItems: CommandItem[] = [
    // Navigation
    {
      id: "nav-dashboard",
      title: "Dashboard",
      description: "Go to main dashboard",
      icon: SquaresFour,
      keywords: ["dashboard", "home", "overview"],
      group: "Navigation",
      action: () => router.push("/"),
    },
    {
      id: "nav-dispatch",
      title: "Visual Planner",
      description: "Dispatch and load planning",
      icon: MapPin,
      keywords: ["dispatch", "planner", "loads", "assign"],
      group: "Navigation",
      action: () => router.push("/dispatch"),
    },
    {
      id: "nav-orders",
      title: "Orders",
      description: "Manage orders and loads",
      icon: ClipboardText,
      keywords: ["orders", "loads", "shipments"],
      group: "Navigation",
      action: () => router.push("/orders"),
    },
    {
      id: "nav-drivers",
      title: "Drivers",
      description: "Driver management and profiles",
      icon: UserCircle,
      keywords: ["drivers", "cdl", "hos"],
      group: "Navigation",
      action: () => router.push("/drivers"),
    },
    {
      id: "nav-equipment",
      title: "Equipment",
      description: "Trucks and trailers",
      icon: Truck,
      keywords: ["equipment", "trucks", "trailers", "maintenance"],
      group: "Navigation",
      action: () => router.push("/equipment"),
    },
    {
      id: "nav-customers",
      title: "Customers",
      description: "Customer management",
      icon: Buildings,
      keywords: ["customers", "shippers", "consignees"],
      group: "Navigation",
      action: () => router.push("/customers"),
    },
    {
      id: "nav-billing",
      title: "Billing",
      description: "Invoicing and settlements",
      icon: CurrencyDollar,
      keywords: ["billing", "invoices", "settlements", "pay"],
      group: "Navigation",
      action: () => router.push("/billing"),
    },
    {
      id: "nav-analytics",
      title: "Analytics",
      description: "Reports and business intelligence",
      icon: ChartLineUp,
      keywords: ["analytics", "reports", "kpi", "dashboard"],
      group: "Navigation",
      action: () => router.push("/analytics"),
    },
    {
      id: "nav-safety",
      title: "Safety & Compliance",
      description: "Safety management and compliance",
      icon: ShieldCheck,
      keywords: ["safety", "compliance", "inspections", "violations"],
      group: "Navigation",
      action: () => router.push("/safety"),
    },
    {
      id: "nav-documents",
      title: "Documents",
      description: "Document management",
      icon: FileText,
      keywords: ["documents", "pod", "bol", "files"],
      group: "Navigation",
      action: () => router.push("/documents"),
    },
    {
      id: "nav-workflows",
      title: "Workflows",
      description: "Automation and workflow management",
      icon: FlowArrow,
      keywords: ["workflows", "automation", "rules"],
      group: "Navigation",
      action: () => router.push("/workflows"),
    },
    {
      id: "nav-integrations",
      title: "Integrations",
      description: "Connected services and partner systems",
      icon: Plug,
      keywords: ["integrations", "eld", "telematics", "edi", "fuel cards"],
      group: "Navigation",
      action: () => router.push("/integrations"),
    },
    {
      id: "nav-settings",
      title: "Settings",
      description: "System configuration",
      icon: Gear,
      keywords: ["settings", "config", "preferences"],
      group: "Navigation",
      action: () => router.push("/settings"),
    },
    // Quick Actions
    {
      id: "action-new-order",
      title: "Create New Order",
      description: "Book a new load",
      icon: ClipboardText,
      keywords: ["new", "create", "order", "load", "book"],
      group: "Quick Actions",
      action: () => router.push("/orders?new=1"),
    },
    {
      id: "action-new-driver",
      title: "Add New Driver",
      description: "Add a driver to your fleet",
      icon: UserCircle,
      keywords: ["new", "add", "driver", "hire"],
      group: "Quick Actions",
      action: () => router.push("/drivers/new"),
    },
    {
      id: "action-new-customer",
      title: "Add New Customer",
      description: "Add a new customer or shipper",
      icon: Buildings,
      keywords: ["new", "add", "customer", "shipper"],
      group: "Quick Actions",
      action: () => router.push("/customers/new"),
    },
  ];

    // Add dynamic order items
    const orderItems: CommandItem[] = (ordersData?.data || []).map(order => ({
      id: `order-${order.id}`,
      title: `Order ${order.orderNumber}`,
      description: `${order.customer?.name || "Unknown Customer"} • ${order.status}`,
      icon: ClipboardText,
      keywords: [
        order.orderNumber,
        order.customer?.name || "",
        order.status,
        "order",
        "load",
        ...(order.stops || []).map(stop => `${stop.city}, ${stop.state}`).filter(Boolean)
      ].filter(Boolean) as string[],
      group: "Orders",
      action: () => router.push(`/orders/${order.id}`),
    }));

    // Add dynamic driver items
    const driverItems: CommandItem[] = (driversData?.data || []).map(driver => ({
      id: `driver-${driver.id}`,
      title: `${driver.firstName} ${driver.lastName}`,
      description: `${driver.employeeId} • ${driver.status}`,
      icon: UserCircle,
      keywords: [
        driver.firstName,
        driver.lastName,
        driver.employeeId,
        driver.status,
        "driver",
        driver.email || "",
        driver.phone || ""
      ].filter(Boolean) as string[],
      group: "Drivers",
      action: () => router.push(`/drivers/${driver.id}`),
    }));

    // Add dynamic customer items
    const customerItems: CommandItem[] = (customersData?.data || []).map(customer => ({
      id: `customer-${customer.id}`,
      title: customer.name,
      description: `${customer.city}, ${customer.state}`,
      icon: Buildings,
      keywords: [
        customer.name,
        customer.city || "",
        customer.state || "",
        "customer",
        "shipper",
        "consignee"
      ].filter(Boolean) as string[],
      group: "Customers",
      action: () => router.push(`/customers/${customer.id}`),
    }));

    // Add equipment items (tractors + trailers)
    const tractorItems: CommandItem[] = (tractorsData?.data || []).map(tractor => ({
      id: `tractor-${tractor.id}`,
      title: `${tractor.unitNumber} — ${tractor.make} ${tractor.model}`,
      description: `${tractor.year || ""} Tractor • ${tractor.status}`,
      icon: Truck,
      keywords: [
        tractor.unitNumber,
        tractor.make,
        tractor.model,
        tractor.status,
        "tractor",
        "equipment",
        "truck",
      ].filter(Boolean) as string[],
      group: "Equipment",
      action: () => router.push(`/equipment?id=${tractor.id}&type=tractor`),
    }));

    const trailerItems: CommandItem[] = (trailersData?.data || []).map(trailer => ({
      id: `trailer-${trailer.id}`,
      title: `${trailer.unitNumber} — ${trailer.trailerType}`,
      description: `Trailer • ${trailer.status}`,
      icon: Truck,
      keywords: [
        trailer.unitNumber,
        trailer.trailerType,
        trailer.status,
        "trailer",
        "equipment",
      ].filter(Boolean) as string[],
      group: "Equipment",
      action: () => router.push(`/equipment?id=${trailer.id}&type=trailer`),
    }));

    return [...staticItems, ...orderItems, ...driverItems, ...customerItems, ...tractorItems, ...trailerItems];
  }, [ordersData, driversData, customersData, tractorsData, trailersData, router]);

  return (
    <NotificationProvider>
      <CommandPaletteProvider items={commandItems}>
        <TooltipProvider delayDuration={0}>
          <div className="flex min-h-[100dvh]">
            <Sidebar
              isMobileOpen={isMobileSidebarOpen}
              onMobileClose={() => setIsMobileSidebarOpen(false)}
            />
            <div className="flex flex-1 flex-col lg:pl-0">
              <TopBar
                onMobileMenuClick={() => setIsMobileSidebarOpen(true)}
              />
              <main className="flex-1 overflow-auto">
                <SectionErrorBoundary>
                  <motion.div
                    className="mx-auto max-w-[1400px] p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      mass: 0.8,
                      duration: 0.4
                    }}
                    layout
                  >
                    {children}
                  </motion.div>
                </SectionErrorBoundary>
              </main>
            </div>
          </div>
        </TooltipProvider>
      </CommandPaletteProvider>
    </NotificationProvider>
  );
}
