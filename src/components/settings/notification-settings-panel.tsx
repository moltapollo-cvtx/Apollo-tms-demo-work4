"use client";

import { Bell, ClockCounterClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  type NotificationFrequency,
  type NotificationSettings,
} from "@/lib/settings-storage";

interface NotificationSettingsPanelProps {
  notifications: NotificationSettings;
  onChange: (next: NotificationSettings) => void;
  className?: string;
  title?: string;
  description?: string;
}

const toggleFields: Array<{
  key: keyof Omit<
    NotificationSettings,
    "frequency" | "quietHoursStart" | "quietHoursEnd"
  >;
  label: string;
  help: string;
}> = [
  {
    key: "emailNotifications",
    label: "Email notifications",
    help: "Send updates through email.",
  },
  {
    key: "smsNotifications",
    label: "SMS notifications",
    help: "Send high-value alerts by text message.",
  },
  {
    key: "pushNotifications",
    label: "Push notifications",
    help: "Show browser and device push notifications.",
  },
  {
    key: "dispatchAlerts",
    label: "Dispatch alerts",
    help: "Notify on load assignments and dispatch changes.",
  },
  {
    key: "safetyAlerts",
    label: "Safety alerts",
    help: "Notify on incidents and compliance risks.",
  },
  {
    key: "billingAlerts",
    label: "Billing alerts",
    help: "Notify on invoice and payment events.",
  },
  {
    key: "maintenanceReminders",
    label: "Maintenance reminders",
    help: "Notify on PM and service due dates.",
  },
  {
    key: "driverHosWarnings",
    label: "Driver HOS warnings",
    help: "Notify on duty-time and break violations.",
  },
];

const frequencyOptions: Array<{ value: NotificationFrequency; label: string }> = [
  { value: "real-time", label: "Real-time" },
  { value: "hourly-digest", label: "Hourly digest" },
  { value: "daily-digest", label: "Daily digest" },
];

export function NotificationSettingsPanel({
  notifications,
  onChange,
  className,
  title = "Notification Preferences",
  description = "Control delivery channels, alert types, and quiet hours.",
}: NotificationSettingsPanelProps) {
  const setField = <K extends keyof NotificationSettings>(
    field: K,
    value: NotificationSettings[K],
  ) => {
    onChange({
      ...notifications,
      [field]: value,
    });
  };

  const setAllToggles = (enabled: boolean) => {
    const next = { ...notifications };

    for (const item of toggleFields) {
      next[item.key] = enabled;
    }

    onChange(next);
  };

  return (
    <section
      className={[
        "rounded-2xl border border-border bg-card p-6 shadow-sm",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Bell className="h-5 w-5 text-primary" />
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAllToggles(true)}
          >
            Enable All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAllToggles(false)}
          >
            Disable All
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {toggleFields.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.help}</p>
            </div>
            <button
              type="button"
              aria-label={item.label}
              aria-pressed={notifications[item.key]}
              onClick={() => setField(item.key, !notifications[item.key])}
              className={[
                "relative h-6 w-11 rounded-full transition-colors",
                notifications[item.key] ? "bg-primary" : "bg-muted",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  notifications[item.key] ? "translate-x-5" : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-sm font-medium text-foreground">Frequency</span>
          <select
            value={notifications.frequency}
            onChange={(event) =>
              setField("frequency", event.target.value as NotificationFrequency)
            }
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            {frequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-foreground">Quiet hours start</span>
          <input
            type="time"
            value={notifications.quietHoursStart}
            onChange={(event) => setField("quietHoursStart", event.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-foreground">Quiet hours end</span>
          <input
            type="time"
            value={notifications.quietHoursEnd}
            onChange={(event) => setField("quietHoursEnd", event.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <ClockCounterClockwise className="h-4 w-4" />
        Changes save to local storage immediately.
      </div>
    </section>
  );
}
