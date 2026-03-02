"use client";

import { useState } from "react";
import {
  House,
  Truck,
  MapPin,
  CurrencyDollar,
  Clock,
  Warning,
  CheckCircle,
  Pencil,
  X,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DriverWithDetails } from "@/types";

interface DriverPreferencesTabProps {
  driver: DriverWithDetails;
}

// ─── editable state shape ─────────────────────────────────────────────────────

interface PreferenceFormState {
  homeTimeFrequency: string;   // "weekly" | "biweekly" | "monthly" | "flexible"
  homeTimeDays: string;        // number as string
  preferredRouteType: string;  // "regional" | "otr" | "local" | "any"
  maxLoadDistance: string;     // miles cap
  preferredEquipment: string;  // "dry_van" | "reefer" | "flatbed" | "any"
  nightDrivingOk: string;      // "yes" | "no" | "preferred"
  teamDriving: string;         // "solo" | "team" | "either"
  hazmatCertified: string;     // "yes" | "no"
  mountainDrivingOk: string;   // "yes" | "no"
  payType: string;             // "percentage" | "per_mile" | "flat"
  payRate: string;             // numeric string
  weeklyMileGoal: string;      // miles target
  notes: string;
}

const defaultPrefs = (driver: DriverWithDetails): PreferenceFormState => {
  const prefs = (driver.preferences || {}) as Record<string, unknown>;
  const pay = (driver.payStructure || {}) as Record<string, unknown>;
  return {
    homeTimeFrequency: String(prefs.homeTimeFrequency || "weekly"),
    homeTimeDays: String(driver.homeTimePreference ?? prefs.homeTimeDays ?? "2"),
    preferredRouteType: String(prefs.preferredRouteType || "any"),
    maxLoadDistance: String(prefs.maxLoadDistance || "1500"),
    preferredEquipment: String(prefs.preferredEquipment || "any"),
    nightDrivingOk: String(prefs.nightDrivingOk || "yes"),
    teamDriving: String(prefs.teamDriving || "solo"),
    hazmatCertified: String(prefs.hazmatCertified || "no"),
    mountainDrivingOk: String(prefs.mountainDrivingOk || "yes"),
    payType: String(pay.type || "percentage"),
    payRate: String(pay.rate || "0.25"),
    weeklyMileGoal: String(prefs.weeklyMileGoal || "2500"),
    notes: String(prefs.notes || ""),
  };
};

// ─── small select helper ──────────────────────────────────────────────────────

function PrefSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PrefInput({
  label,
  value,
  type = "text",
  suffix,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  type?: string;
  suffix?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20",
            disabled && "cursor-not-allowed opacity-60",
          )}
        />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function DriverPreferencesTab({ driver }: DriverPreferencesTabProps) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<PreferenceFormState>(() => defaultPrefs(driver));

  const set = (key: keyof PreferenceFormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    // In a real app this would call an API; for the demo we just show success.
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setForm(defaultPrefs(driver));
    setEditing(false);
  };

  const payRateLabel =
    form.payType === "percentage"
      ? `${(parseFloat(form.payRate) * 100 || 0).toFixed(0)}% of load revenue`
      : form.payType === "per_mile"
      ? `$${parseFloat(form.payRate).toFixed(2)} / mile`
      : `$${parseFloat(form.payRate).toFixed(0)} flat per load`;

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Driver Preferences &amp; Pay Structure</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Home-time, routing, equipment, and pay preferences for this driver.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-apollo-cyan-700 font-medium">
              <CheckCircle className="h-3.5 w-3.5" weight="fill" />
              Saved
            </span>
          )}
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Save Preferences
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Home Time</p>
            <House className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-mono text-xl font-semibold text-foreground">{form.homeTimeDays}d</p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">{form.homeTimeFrequency}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Route Type</p>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground capitalize">{form.preferredRouteType.replace("_", " ")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Max {parseInt(form.maxLoadDistance).toLocaleString()} mi</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Equipment</p>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground capitalize">{form.preferredEquipment.replace("_", " ")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{form.teamDriving === "solo" ? "Solo driver" : form.teamDriving === "team" ? "Team driver" : "Solo or team"}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Pay Structure</p>
            <CurrencyDollar className="h-4 w-4 text-apollo-cyan-600" />
          </div>
          <p className="text-sm font-semibold text-foreground capitalize">{form.payType.replace("_", " ")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{payRateLabel}</p>
        </Card>
      </div>

      {/* Home Time & Scheduling */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <House className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Home Time &amp; Scheduling</h4>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PrefSelect
            label="Home Time Frequency"
            value={form.homeTimeFrequency}
            options={[
              { value: "weekly", label: "Weekly" },
              { value: "biweekly", label: "Every 2 Weeks" },
              { value: "monthly", label: "Monthly" },
              { value: "flexible", label: "Flexible" },
            ]}
            onChange={set("homeTimeFrequency")}
            disabled={!editing}
          />
          <PrefInput
            label="Days at Home"
            value={form.homeTimeDays}
            type="number"
            suffix="days"
            onChange={set("homeTimeDays")}
            disabled={!editing}
          />
          <PrefInput
            label="Weekly Mile Goal"
            value={form.weeklyMileGoal}
            type="number"
            suffix="mi"
            onChange={set("weeklyMileGoal")}
            disabled={!editing}
          />
        </div>
      </Card>

      {/* Route & Equipment */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Route &amp; Equipment Preferences</h4>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PrefSelect
            label="Preferred Route Type"
            value={form.preferredRouteType}
            options={[
              { value: "local", label: "Local (< 150 mi)" },
              { value: "regional", label: "Regional (150–500 mi)" },
              { value: "otr", label: "OTR (500+ mi)" },
              { value: "any", label: "Any Route" },
            ]}
            onChange={set("preferredRouteType")}
            disabled={!editing}
          />
          <PrefInput
            label="Max Load Distance"
            value={form.maxLoadDistance}
            type="number"
            suffix="mi"
            onChange={set("maxLoadDistance")}
            disabled={!editing}
          />
          <PrefSelect
            label="Preferred Equipment"
            value={form.preferredEquipment}
            options={[
              { value: "dry_van", label: "Dry Van" },
              { value: "reefer", label: "Reefer" },
              { value: "flatbed", label: "Flatbed" },
              { value: "tanker", label: "Tanker" },
              { value: "step_deck", label: "Step Deck" },
              { value: "any", label: "Any Equipment" },
            ]}
            onChange={set("preferredEquipment")}
            disabled={!editing}
          />
          <PrefSelect
            label="Night Driving"
            value={form.nightDrivingOk}
            options={[
              { value: "preferred", label: "Preferred" },
              { value: "yes", label: "Available" },
              { value: "no", label: "Not Available" },
            ]}
            onChange={set("nightDrivingOk")}
            disabled={!editing}
          />
          <PrefSelect
            label="Team Driving"
            value={form.teamDriving}
            options={[
              { value: "solo", label: "Solo Only" },
              { value: "team", label: "Team Only" },
              { value: "either", label: "Either" },
            ]}
            onChange={set("teamDriving")}
            disabled={!editing}
          />
          <PrefSelect
            label="Mountain / Grade Driving"
            value={form.mountainDrivingOk}
            options={[
              { value: "yes", label: "Available" },
              { value: "no", label: "Prefers Flat Routes" },
            ]}
            onChange={set("mountainDrivingOk")}
            disabled={!editing}
          />
        </div>
      </Card>

      {/* Certifications */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Warning className="h-4 w-4 text-amber-500" />
          <h4 className="text-sm font-semibold text-foreground">Special Certifications</h4>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PrefSelect
            label="HazMat Certified"
            value={form.hazmatCertified}
            options={[
              { value: "yes", label: "Yes — Active certification" },
              { value: "no", label: "No" },
            ]}
            onChange={set("hazmatCertified")}
            disabled={!editing}
          />
          <div className="flex items-center gap-2 mt-5">
            <Badge
              className={cn(
                "border text-xs",
                form.hazmatCertified === "yes"
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {form.hazmatCertified === "yes" ? "HazMat Eligible" : "Non-HazMat"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Pay Structure */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <CurrencyDollar className="h-4 w-4 text-apollo-cyan-600" />
          <h4 className="text-sm font-semibold text-foreground">Pay Structure</h4>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PrefSelect
            label="Pay Type"
            value={form.payType}
            options={[
              { value: "percentage", label: "% of Load Revenue" },
              { value: "per_mile", label: "Per Mile (CPM)" },
              { value: "flat", label: "Flat Rate per Load" },
            ]}
            onChange={set("payType")}
            disabled={!editing}
          />
          <PrefInput
            label={
              form.payType === "percentage"
                ? "Rate (decimal, e.g. 0.25 = 25%)"
                : form.payType === "per_mile"
                ? "Cents Per Mile ($)"
                : "Flat Rate per Load ($)"
            }
            value={form.payRate}
            type="number"
            onChange={set("payRate")}
            disabled={!editing}
          />
          <div className="flex items-end pb-1">
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground w-full">
              <Clock className="inline h-3.5 w-3.5 mr-1 mb-0.5" />
              {payRateLabel}
            </div>
          </div>
        </div>
      </Card>

      {/* Notes */}
      <Card className="p-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Dispatcher Notes</h4>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes")(e.target.value)}
          disabled={!editing}
          rows={3}
          placeholder="Any additional scheduling notes or driver-specific considerations..."
          className={cn(
            "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/20",
            !editing && "opacity-60 cursor-not-allowed",
          )}
        />
      </Card>
    </div>
  );
}
