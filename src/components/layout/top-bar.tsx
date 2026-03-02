"use client";

import { useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MagnifyingGlass, Bell, CaretDown, List, User, Gear } from "@phosphor-icons/react";
import { useCommandPalette } from "@/components/ui/command-palette";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import { useNotifications, type AppNotification } from "@/components/notifications/notification-context";

interface TopBarProps {
  onMobileMenuClick?: () => void;
}

export function TopBar({ onMobileMenuClick }: TopBarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();

  const handleSignOut = useCallback(async () => {
    await signOut({ callbackUrl: "/login" });
  }, []);

  const handleNotificationClick = useCallback(() => {
    setShowNotifications(true);
  }, []);

  const handleNotificationClose = useCallback(() => {
    setShowNotifications(false);
  }, []);

  const handleNotificationItemClick = useCallback((notification: AppNotification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    setShowNotifications(false);
  }, [router]);

  // Get user initials
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Format role for display
  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6"
    >
      {/* Left side - Mobile menu + Search */}
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu button - Enhanced Accessibility */}
        <motion.button
          onClick={onMobileMenuClick}
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background touch-manipulation"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          aria-label="Open navigation menu"
          aria-expanded="false"
        >
          <List className="h-5 w-5" weight="bold" aria-hidden="true" />
        </motion.button>

        {/* Global Search — opens command palette */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="relative flex h-9 w-full max-w-md items-center rounded-md bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <MagnifyingGlass className="mr-2 h-4 w-4" />
          <span>Search loads, drivers, customers...</span>
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right side - Notifications + User menu */}
      <div className="flex items-center gap-3">
        {/* Notifications - Enhanced Accessibility */}
        <motion.button
          onClick={handleNotificationClick}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background touch-manipulation"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "View notifications"}
        >
          <motion.div
            key={unreadCount > 0 ? `unread-${unreadCount}` : "notifications-idle"}
            animate={unreadCount > 0 ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={
              unreadCount > 0
                ? { type: "tween", duration: 0.9, ease: "easeInOut" }
                : { type: "spring", stiffness: 420, damping: 22 }
            }
          >
            <Bell className="h-5 w-5" weight="duotone" />
          </motion.div>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 15,
                delay: 0.1
              }}
              className="absolute -right-0.5 -top-0.5"
            >
              <Badge className="flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px] bg-red-500 hover:bg-red-500 border-2 border-card">
                <motion.span
                  key={unreadCount}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 600,
                    damping: 20
                  }}
                  className="font-mono font-bold text-white"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </motion.span>
              </Badge>
            </motion.div>
          )}
        </motion.button>

        {/* User menu */}
        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-accent"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getUserInitials(session.user.name?.split(' ')[0] || 'U', session.user.name?.split(' ')[1] || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-none">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{formatRole(session.user.role)}</p>
                </div>
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CaretDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
              <div className="px-2 py-2">
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
                <p className="text-xs text-muted-foreground">{session.user.organization?.name}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => router.push("/settings")}
              >
                <Gear className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => router.push("/settings/notifications")}
              >
                <Bell className="h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={handleSignOut}
              >
                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  Sign out
                </motion.div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={handleNotificationClose}
        onNotificationClick={handleNotificationItemClick}
      />
    </motion.header>
  );
}
