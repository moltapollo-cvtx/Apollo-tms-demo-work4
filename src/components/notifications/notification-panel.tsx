"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bell,
  CheckCircle,
  Circle,
  Truck,
  Receipt,
  Shield,
  Users,
  Gear,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  type AppNotification,
  type NotificationType,
  type NotificationPriority,
} from "@/components/notifications/notification-context";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
}

const groupOrder = ["Today", "Yesterday", "Earlier This Week", "Older"] as const;

export function NotificationPanel({ isOpen, onClose, onNotificationClick }: NotificationPanelProps) {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [selectedType, setSelectedType] = useState<NotificationType | "all">("all");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const notificationTypes = [
    { value: "all", label: "All", icon: Bell, count: notifications.length },
    {
      value: "load",
      label: "Loads",
      icon: Truck,
      count: notifications.filter((notification) => notification.type === "load").length,
    },
    {
      value: "driver",
      label: "Drivers",
      icon: Users,
      count: notifications.filter((notification) => notification.type === "driver").length,
    },
    {
      value: "billing",
      label: "Billing",
      icon: Receipt,
      count: notifications.filter((notification) => notification.type === "billing").length,
    },
    {
      value: "safety",
      label: "Safety",
      icon: Shield,
      count: notifications.filter((notification) => notification.type === "safety").length,
    },
    {
      value: "system",
      label: "System",
      icon: Gear,
      count: notifications.filter((notification) => notification.type === "system").length,
    },
  ];

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((notification) => {
        const typeMatch = selectedType === "all" || notification.type === selectedType;
        const readMatch = !showOnlyUnread || !notification.isRead;
        return typeMatch && readMatch;
      })
      .sort(
        (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
      );
  }, [notifications, selectedType, showOnlyUnread]);

  const groupedNotifications = useMemo(() => {
    const groups = new Map<string, AppNotification[]>();

    filteredNotifications.forEach((notification) => {
      const label = getDateGroupLabel(new Date(notification.timestamp));
      const current = groups.get(label) ?? [];
      current.push(notification);
      groups.set(label, current);
    });

    return groupOrder
      .filter((label) => groups.has(label))
      .map((label) => ({
        label,
        notifications: groups.get(label) ?? [],
      }));
  }, [filteredNotifications]);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "load":
        return Truck;
      case "driver":
        return Users;
      case "billing":
        return Receipt;
      case "safety":
        return Shield;
      case "system":
        return Gear;
      default:
        return Bell;
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200";
      case "low":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/50 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-[480px] max-w-[95vw] border-l border-border bg-card z-50 flex flex-col shadow-lg"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" weight="duotone" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                  <p className="text-sm text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant={showOnlyUnread ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setShowOnlyUnread((prev) => !prev)}
                  className="h-8"
                >
                  {showOnlyUnread ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <Circle className="h-3 w-3 mr-1" />
                  )}
                  Unread only
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClose();
                    router.push("/settings/notifications");
                  }}
                >
                  <Gear className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {notificationTypes.map((type) => {
                  const Icon = type.icon;
                  const isActive = selectedType === type.value;

                  return (
                    <Button
                      key={type.value}
                      variant={isActive ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedType(type.value as NotificationType | "all")}
                      className={cn("h-8 text-xs", isActive && "bg-primary text-primary-foreground")}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {type.label}
                      {type.count > 0 && (
                        <Badge
                          className={cn(
                            "ml-1 text-xs h-4 px-1.5",
                            isActive
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {type.count}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence>
                {groupedNotifications.length > 0 ? (
                  <div className="px-4 py-2 space-y-5">
                    {groupedNotifications.map((group) => (
                      <div key={group.label} className="space-y-2">
                        <div className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {group.label}
                        </div>
                        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                          {group.notifications.map((notification) => {
                            const Icon = getNotificationIcon(notification.type);

                            return (
                              <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={cn(
                                  "p-4 hover:bg-muted/50 transition-colors cursor-pointer group",
                                  !notification.isRead && "bg-primary/5",
                                )}
                                onClick={() => {
                                  markAsRead(notification.id);
                                  onNotificationClick?.(notification);
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                      notification.type === "load" && "bg-apollo-cyan-100 text-apollo-cyan-700",
                                      notification.type === "driver" && "bg-apollo-cyan-100 text-apollo-cyan-600",
                                      notification.type === "billing" && "bg-apollo-cyan-50 text-apollo-cyan-700",
                                      notification.type === "safety" && "bg-red-100 text-red-600",
                                      notification.type === "system" && "bg-slate-100 text-slate-600",
                                    )}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                      <h3
                                        className={cn(
                                          "text-sm font-medium truncate",
                                          notification.isRead ? "text-muted-foreground" : "text-foreground",
                                        )}
                                      >
                                        {notification.title}
                                      </h3>
                                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                        {notification.priority === "urgent" && (
                                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        )}
                                        {!notification.isRead && <div className="w-2 h-2 bg-primary rounded-full" />}
                                      </div>
                                    </div>

                                    <p
                                      className={cn(
                                        "text-sm leading-relaxed mb-2",
                                        notification.isRead
                                          ? "text-muted-foreground"
                                          : "text-foreground/80",
                                      )}
                                    >
                                      {notification.message}
                                    </p>

                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge className={cn("text-xs", getPriorityBadge(notification.priority))}>
                                          {notification.priority}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {formatTimestamp(new Date(notification.timestamp))}
                                        </span>
                                      </div>

                                      {notification.actionLabel && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button variant="ghost" size="sm" className="h-6 text-xs">
                                            {notification.actionLabel}
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        if (notification.isRead) {
                                          markAsUnread(notification.id);
                                        } else {
                                          markAsRead(notification.id);
                                        }
                                      }}
                                      aria-label={notification.isRead ? "Mark unread" : "Mark read"}
                                    >
                                      {notification.isRead ? (
                                        <Circle className="h-3 w-3" />
                                      ) : (
                                        <CheckCircle className="h-3 w-3" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        deleteNotification(notification.id);
                                      }}
                                    >
                                      <Trash className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-64 text-center p-6"
                  >
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                      <Bell className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      {showOnlyUnread
                        ? "No unread notifications at the moment"
                        : `No ${selectedType === "all" ? "" : selectedType} notifications to show`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function getDateGroupLabel(date: Date) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.floor((startOfToday - startOfDate) / (24 * 60 * 60 * 1000));

  if (dayDiff === 0) {
    return "Today";
  }

  if (dayDiff === 1) {
    return "Yesterday";
  }

  if (dayDiff <= 6) {
    return "Earlier This Week";
  }

  return "Older";
}
