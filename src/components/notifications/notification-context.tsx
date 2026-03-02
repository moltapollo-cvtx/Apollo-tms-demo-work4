"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type NotificationType = "load" | "driver" | "billing" | "safety" | "system";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, string>;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAsUnread: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
}

const STORAGE_KEY = "apollo-tms.notifications.v1";

const NotificationContext = createContext<NotificationContextValue | null>(null);

const buildDefaultNotifications = (): AppNotification[] => {
  const now = Date.now();

  return [
    {
      id: "notif-1",
      type: "load",
      priority: "urgent",
      title: "Load Running Late",
      message: "Load TMS-24-08847 is 2 hours behind schedule. Customer has been notified.",
      timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
      isRead: false,
      actionUrl: "/orders/TMS-24-08847",
      actionLabel: "View Load",
      metadata: { orderNumber: "TMS-24-08847" },
    },
    {
      id: "notif-2",
      type: "driver",
      priority: "high",
      title: "Driver Certificate Expiring",
      message: "Mike Rodriguez's medical certificate expires in 15 days.",
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      actionUrl: "/drivers/mike-rodriguez",
      actionLabel: "View Driver",
      metadata: { driverId: "mike-rodriguez" },
    },
    {
      id: "notif-3",
      type: "billing",
      priority: "medium",
      title: "Invoice Generated",
      message: "Invoice #INV-2024-0087 has been automatically generated for $2,450.75.",
      timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      actionUrl: "/billing/invoices/INV-2024-0087",
      actionLabel: "View Invoice",
      metadata: { invoiceNumber: "INV-2024-0087" },
    },
    {
      id: "notif-4",
      type: "safety",
      priority: "high",
      title: "Safety Incident Report",
      message: "New incident reported by driver Sarah Thompson. Requires immediate attention.",
      timestamp: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      actionUrl: "/safety/incidents/latest",
      actionLabel: "View Report",
      metadata: { driverId: "sarah-thompson" },
    },
    {
      id: "notif-5",
      type: "system",
      priority: "low",
      title: "System Maintenance",
      message: "Scheduled maintenance will occur tonight at 2:00 AM EST (estimated 2 hours).",
      timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      actionUrl: "/system/maintenance",
      actionLabel: "Learn More",
    },
    {
      id: "notif-6",
      type: "load",
      priority: "medium",
      title: "New Load Assignment",
      message: "Load TMS-24-08856 has been assigned to driver David Wilson.",
      timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      actionUrl: "/orders/TMS-24-08856",
      actionLabel: "View Load",
      metadata: { orderNumber: "TMS-24-08856" },
    },
  ];
};

const sanitizeNotifications = (value: unknown): AppNotification[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const allValid = value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof (item as AppNotification).id === "string" &&
      typeof (item as AppNotification).type === "string" &&
      typeof (item as AppNotification).title === "string" &&
      typeof (item as AppNotification).message === "string" &&
      typeof (item as AppNotification).timestamp === "string" &&
      typeof (item as AppNotification).isRead === "boolean",
  );

  return allValid ? (value as AppNotification[]) : null;
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => buildDefaultNotifications());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawValue = localStorage.getItem(STORAGE_KEY);
      if (!rawValue) {
        setHydrated(true);
        return;
      }

      const parsed = JSON.parse(rawValue) as unknown;
      const validated = sanitizeNotifications(parsed);

      if (validated) {
        setNotifications(validated);
      }
    } catch {
      // Ignore malformed local cache and keep defaults.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [hydrated, notifications]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    );
  }, []);

  const markAsUnread = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: false } : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      deleteNotification,
    }),
    [deleteNotification, markAllAsRead, markAsRead, markAsUnread, notifications, unreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }

  return context;
}
