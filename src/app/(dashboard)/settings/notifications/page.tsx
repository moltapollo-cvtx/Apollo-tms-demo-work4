"use client";

import { useEffect, useState } from "react";
import { NotificationSettingsPanel } from "@/components/settings/notification-settings-panel";
import {
  createDefaultApolloSettings,
  loadApolloSettings,
  saveApolloSettings,
  type ApolloSettings,
  type NotificationSettings,
} from "@/lib/settings-storage";

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<ApolloSettings>(createDefaultApolloSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadApolloSettings();
    setSettings((prev) => (JSON.stringify(prev) === JSON.stringify(loaded) ? prev : loaded));
    setIsHydrated((prev) => (prev === true ? prev : true));
  }, []);

  const handleNotificationChange = (nextNotifications: NotificationSettings) => {
    setSettings((current) => {
      const nextSettings = {
        ...current,
        notifications: nextNotifications,
      };
      saveApolloSettings(nextSettings);
      return nextSettings;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Notification Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage dispatch, safety, billing, and channel-level alerts.
        </p>
      </div>

      {isHydrated ? (
        <NotificationSettingsPanel
          notifications={settings.notifications}
          onChange={handleNotificationChange}
          description="All notification changes persist immediately in local storage."
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading notification preferences...
        </div>
      )}
    </div>
  );
}
