"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  DeviceMobile,
  Envelope,
  Desktop,
  Clock,
  Users,
  Truck,
  Receipt,
  Shield,
  Gear,
  CheckCircle,
  type Icon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationChannel = "email" | "sms" | "push" | "in_app";
type NotificationCategory = "loads" | "drivers" | "billing" | "safety" | "system";
type NotificationPriority = "all" | "high" | "urgent";
type NotificationFrequency = "immediate" | "hourly" | "daily";

interface NotificationSetting {
  category: NotificationCategory;
  label: string;
  description: string;
  icon: Icon;
  color: string;
  channels: {
    [key in NotificationChannel]: {
      enabled: boolean;
      priority?: NotificationPriority;
    };
  };
  quietHours?: boolean;
  frequency?: NotificationFrequency;
}

interface GlobalNotificationSettings {
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  groupSimilar: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

interface NotificationPreferencesProps {
  className?: string;
  onSave?: (payload: {
    settings: NotificationSetting[];
    globalSettings: GlobalNotificationSettings;
  }) => void;
}

export function NotificationPreferences({ className, onSave }: NotificationPreferencesProps) {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      category: "loads",
      label: "Load Management",
      description: "Notifications about load status, assignments, and delivery updates",
      icon: Truck,
      color: "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200",
      channels: {
        email: { enabled: true, priority: "all" },
        sms: { enabled: true, priority: "urgent" },
        push: { enabled: true, priority: "high" },
        in_app: { enabled: true, priority: "all" }
      },
      quietHours: true,
      frequency: "immediate"
    },
    {
      category: "drivers",
      label: "Driver Management",
      description: "Driver assignments, certifications, and performance alerts",
      icon: Users,
      color: "bg-apollo-cyan-100 text-apollo-cyan-600 border-apollo-cyan-200",
      channels: {
        email: { enabled: true, priority: "high" },
        sms: { enabled: false, priority: "urgent" },
        push: { enabled: true, priority: "high" },
        in_app: { enabled: true, priority: "all" }
      },
      quietHours: true,
      frequency: "immediate"
    },
    {
      category: "billing",
      label: "Billing & Invoicing",
      description: "Invoice generation, payment updates, and financial reports",
      icon: Receipt,
      color: "bg-apollo-cyan-50 text-apollo-cyan-700 border-apollo-cyan-200",
      channels: {
        email: { enabled: true, priority: "all" },
        sms: { enabled: false, priority: "urgent" },
        push: { enabled: false, priority: "high" },
        in_app: { enabled: true, priority: "all" }
      },
      quietHours: false,
      frequency: "daily"
    },
    {
      category: "safety",
      label: "Safety & Compliance",
      description: "Safety incidents, compliance violations, and certification renewals",
      icon: Shield,
      color: "bg-red-100 text-red-600 border-red-200",
      channels: {
        email: { enabled: true, priority: "all" },
        sms: { enabled: true, priority: "high" },
        push: { enabled: true, priority: "all" },
        in_app: { enabled: true, priority: "all" }
      },
      quietHours: false,
      frequency: "immediate"
    },
    {
      category: "system",
      label: "System Updates",
      description: "System maintenance, feature updates, and technical notifications",
      icon: Gear,
      color: "bg-slate-100 text-slate-600 border-slate-200",
      channels: {
        email: { enabled: true, priority: "high" },
        sms: { enabled: false, priority: "urgent" },
        push: { enabled: false, priority: "high" },
        in_app: { enabled: true, priority: "all" }
      },
      quietHours: true,
      frequency: "daily"
    }
  ]);

  const [globalSettings, setGlobalSettings] = useState<GlobalNotificationSettings>({
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    timezone: "America/New_York",
    groupSimilar: true,
    soundEnabled: true,
    desktopNotifications: true
  });
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("apollo-notification-prefs");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.settings) setSettings((prev) => (JSON.stringify(prev) === JSON.stringify(parsed.settings) ? prev : parsed.settings));
        if (parsed.globalSettings) setGlobalSettings((prev) => (JSON.stringify(prev) === JSON.stringify(parsed.globalSettings) ? prev : parsed.globalSettings));
        setLastSavedAt((prev) => (prev === "restored" ? prev : "restored"));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const channels = [
    { key: "in_app", label: "In-App", icon: Bell, description: "Notifications within Apollo TMS" },
    { key: "email", label: "Email", icon: Envelope, description: "Email notifications" },
    { key: "sms", label: "SMS", icon: DeviceMobile, description: "Text message alerts" },
    { key: "push", label: "Push", icon: Desktop, description: "Browser push notifications" }
  ];

  const priorities = [
    { key: "all", label: "All", description: "All notifications" },
    { key: "high", label: "High", description: "High priority only" },
    { key: "urgent", label: "Urgent", description: "Urgent only" }
  ];

  const frequencies = [
    { key: "immediate", label: "Immediate", description: "Send right away" },
    { key: "hourly", label: "Hourly", description: "Send hourly digest" },
    { key: "daily", label: "Daily", description: "Send daily summary" }
  ];

  const updateChannelSetting = (
    categoryIndex: number,
    channel: NotificationChannel,
    field: "enabled" | "priority",
    value: boolean | string
  ) => {
    setSettings(prev =>
      prev.map((setting, index) =>
        index === categoryIndex
          ? {
              ...setting,
              channels: {
                ...setting.channels,
                [channel]: {
                  ...setting.channels[channel],
                  [field]: value
                }
              }
            }
          : setting
      )
    );
  };

  const updateCategorySetting = (
    categoryIndex: number,
    field: "quietHours" | "frequency",
    value: NotificationSetting["quietHours"] | NotificationSetting["frequency"]
  ) => {
    setSettings(prev =>
      prev.map((setting, index) =>
        index === categoryIndex ? { ...setting, [field]: value } : setting
      )
    );
  };

  const savePreferences = () => {
    // Persist to localStorage
    try {
      localStorage.setItem("apollo-notification-prefs", JSON.stringify({ settings, globalSettings }));
    } catch {
      // ignore quota errors
    }
    onSave?.({ settings, globalSettings });
    setLastSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Notification Preferences
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize how and when you receive notifications from Apollo TMS.
          </p>
        </div>
        <Button onClick={savePreferences} className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {lastSavedAt ? `Saved ${lastSavedAt}` : "Save Preferences"}
        </Button>
      </motion.div>

      {/* Global Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border shadow-sm"
      >
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Global Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            General notification preferences that apply across all categories.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Quiet Hours
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={globalSettings.quietHoursStart}
                    onChange={(e) =>
                      setGlobalSettings(prev => ({ ...prev, quietHoursStart: e.target.value }))
                    }
                    className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <input
                    type="time"
                    value={globalSettings.quietHoursEnd}
                    onChange={(e) =>
                      setGlobalSettings(prev => ({ ...prev, quietHoursEnd: e.target.value }))
                    }
                    className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Timezone
                </label>
                <select
                  value={globalSettings.timezone}
                  onChange={(e) =>
                    setGlobalSettings(prev => ({ ...prev, timezone: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Group Similar Notifications</div>
                  <div className="text-xs text-muted-foreground">Combine similar notifications</div>
                </div>
                <button
                  onClick={() =>
                    setGlobalSettings(prev => ({ ...prev, groupSimilar: !prev.groupSimilar }))
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                    globalSettings.groupSimilar ? "bg-primary" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      globalSettings.groupSimilar ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Sound Notifications</div>
                  <div className="text-xs text-muted-foreground">Play sound for notifications</div>
                </div>
                <button
                  onClick={() =>
                    setGlobalSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                    globalSettings.soundEnabled ? "bg-primary" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      globalSettings.soundEnabled ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Desktop Notifications</div>
                  <div className="text-xs text-muted-foreground">Show browser notifications</div>
                </div>
                <button
                  onClick={() =>
                    setGlobalSettings(prev => ({ ...prev, desktopNotifications: !prev.desktopNotifications }))
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                    globalSettings.desktopNotifications ? "bg-primary" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      globalSettings.desktopNotifications ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category Settings */}
      <div className="space-y-4">
        {settings.map((setting, settingIndex) => {
          const Icon = setting.icon;

          return (
            <motion.div
              key={setting.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + settingIndex * 0.1 }}
              className="bg-card rounded-xl border border-border shadow-sm"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", setting.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{setting.label}</h3>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {channels.map((channel) => {
                    const ChannelIcon = channel.icon;
                    const channelSetting = setting.channels[channel.key as NotificationChannel];

                    return (
                      <div key={channel.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {channel.label}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              updateChannelSetting(
                                settingIndex,
                                channel.key as NotificationChannel,
                                "enabled",
                                !channelSetting.enabled
                              )
                            }
                            className={cn(
                              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                              channelSetting.enabled ? "bg-primary" : "bg-slate-200"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                                channelSetting.enabled ? "translate-x-5" : "translate-x-1"
                              )}
                            />
                          </button>
                        </div>

                        {channelSetting.enabled && (
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              Priority Level
                            </label>
                            <select
                              value={channelSetting.priority}
                              onChange={(e) =>
                                updateChannelSetting(
                                  settingIndex,
                                  channel.key as NotificationChannel,
                                  "priority",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 rounded border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                            >
                              {priorities.map((priority) => (
                                <option key={priority.key} value={priority.key}>
                                  {priority.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Frequency:</span>
                        <select
                          value={setting.frequency}
                          onChange={(e) =>
                            updateCategorySetting(settingIndex, "frequency", e.target.value as NotificationFrequency)
                          }
                          className="px-2 py-1 rounded border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                        >
                          {frequencies.map((freq) => (
                            <option key={freq.key} value={freq.key}>
                              {freq.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Respect quiet hours:</span>
                      <button
                        onClick={() =>
                          updateCategorySetting(settingIndex, "quietHours", !setting.quietHours)
                        }
                        className={cn(
                          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                          setting.quietHours ? "bg-primary" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                            setting.quietHours ? "translate-x-5" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
