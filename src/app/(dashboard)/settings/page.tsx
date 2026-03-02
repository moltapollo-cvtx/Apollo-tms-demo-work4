"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Buildings,
  CaretRight,
  Database,
  GlobeHemisphereWest,
  Lock,
  Plug,
  Shield,
  Users,
  CheckCircle,
  Pencil,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingsTile {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const settingsTiles: SettingsTile[] = [
  { id: "company", title: "Company Profile", description: "Business identity, contact details, and logo", icon: Buildings },
  { id: "users", title: "User Management", description: "Manage team members, roles, and permissions", icon: Users },
  { id: "notifications", title: "Notifications", description: "Alert preferences, channels, and quiet hours", icon: Bell },
  { id: "integrations", title: "Integrations", description: "ELD, GPS, fuel cards, and partner connections", icon: Plug },
  { id: "display", title: "Display & Appearance", description: "Theme, date/time formats, units, and layout density", icon: GlobeHemisphereWest },
  { id: "security", title: "Security", description: "Password, two-factor authentication, and sessions", icon: Shield },
  { id: "privacy", title: "Privacy & Access", description: "Session timeout, audit logs, and access controls", icon: Lock },
  { id: "data", title: "Data Management", description: "Export, import, retention policies, and demo data", icon: Database },
];

// ─── Reusable field helpers ────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, disabled, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; type?: string;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      className={cn("w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20", disabled && "opacity-60 cursor-not-allowed")}
    />
  );
}

function SelectInput({ value, onChange, options, disabled }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; disabled?: boolean;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
      className={cn("w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20", disabled && "opacity-60 cursor-not-allowed")}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toggle({ checked, onChange, label, description, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20", checked ? "bg-primary" : "bg-border", disabled && "opacity-50 cursor-not-allowed")}
      >
        <span className={cn("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-4" : "translate-x-0")} />
      </button>
    </div>
  );
}

// ─── Section components ────────────────────────────────────────────────────────

function CompanyProfileSection() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "Apollo Logistics LLC", dot: "3847291", mc: "MC-884722",
    address: "4801 Airport Pkwy, Suite 200", city: "Dallas", state: "TX", zip: "75261",
    phone: "(214) 555-0192", email: "dispatch@apollologistics.com",
    website: "www.apollologistics.com", timezone: "America/Chicago",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((p) => ({ ...p, [k]: v }));
  const save = () => { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 3000); };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage your company details and regulatory identifiers.</p>
        <div className="flex items-center gap-2">
          {saved && <span className="flex items-center gap-1 text-xs text-apollo-cyan-700 font-medium"><CheckCircle className="h-3.5 w-3.5" weight="fill" /> Saved</span>}
          {editing ? (
            <><Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
            <Button size="sm" onClick={save}><CheckCircle className="h-3.5 w-3.5 mr-1" /> Save</Button></>
          ) : <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <h3 className="text-sm font-semibold text-foreground">Business Identity</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldGroup label="Company Name"><TextInput value={form.name} onChange={set("name")} disabled={!editing} /></FieldGroup>
          <FieldGroup label="DOT Number"><TextInput value={form.dot} onChange={set("dot")} disabled={!editing} /></FieldGroup>
          <FieldGroup label="MC Number"><TextInput value={form.mc} onChange={set("mc")} disabled={!editing} /></FieldGroup>
          <FieldGroup label="Time Zone"><SelectInput value={form.timezone} onChange={set("timezone")} disabled={!editing} options={[
            { value: "America/New_York", label: "Eastern (ET)" }, { value: "America/Chicago", label: "Central (CT)" },
            { value: "America/Denver", label: "Mountain (MT)" }, { value: "America/Los_Angeles", label: "Pacific (PT)" },
          ]} /></FieldGroup>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <h3 className="text-sm font-semibold text-foreground">Contact & Location</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldGroup label="Street Address"><TextInput value={form.address} onChange={set("address")} disabled={!editing} /></FieldGroup>
          <FieldGroup label="City"><TextInput value={form.city} onChange={set("city")} disabled={!editing} /></FieldGroup>
          <FieldGroup label="State"><TextInput value={form.state} onChange={set("state")} disabled={!editing} /></FieldGroup>
          <FieldGroup label="ZIP"><TextInput value={form.zip} onChange={set("zip")} disabled={!editing} /></FieldGroup>
          <FieldGroup label="Phone"><TextInput value={form.phone} onChange={set("phone")} type="tel" disabled={!editing} /></FieldGroup>
          <FieldGroup label="Email"><TextInput value={form.email} onChange={set("email")} type="email" disabled={!editing} /></FieldGroup>
          <FieldGroup label="Website"><TextInput value={form.website} onChange={set("website")} disabled={!editing} /></FieldGroup>
        </div>
      </div>
    </div>
  );
}

function UserManagementSection() {
  const users = [
    { name: "Mila Torres", email: "mila@apollologistics.com", role: "Admin", status: "active" },
    { name: "James Okafor", email: "james@apollologistics.com", role: "Dispatcher", status: "active" },
    { name: "Sarah Chen", email: "sarah@apollologistics.com", role: "Accounting", status: "active" },
    { name: "Derek Wilson", email: "derek@apollologistics.com", role: "Safety Manager", status: "inactive" },
  ];
  const roleColors: Record<string, string> = {
    Admin: "bg-purple-100 text-purple-700 border-purple-200",
    Dispatcher: "bg-blue-100 text-blue-700 border-blue-200",
    Accounting: "bg-amber-100 text-amber-700 border-amber-200",
    "Safety Manager": "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage team access, roles, and permissions.</p>
        <Button size="sm">Invite User</Button>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              {["Name", "Email", "Role", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.email} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3"><span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", roleColors[u.role] || "border-border bg-muted")}>{u.role}</span></td>
                <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", u.status === "active" ? "bg-apollo-cyan-100 text-apollo-cyan-700" : "bg-zinc-100 text-zinc-600")}>{u.status}</span></td>
                <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" className="text-xs h-7">Edit</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Role Permissions</h3>
        <div className="divide-y divide-border/50 text-xs text-muted-foreground">
          {[
            { role: "Admin", perms: "Full access to all modules including settings, billing, and user management." },
            { role: "Dispatcher", perms: "Dispatch, orders, drivers, fleet map, and analytics." },
            { role: "Accounting", perms: "Billing, settlements, invoices, and financial reports." },
            { role: "Safety Manager", perms: "Safety, compliance, driver documents, and incident reports." },
          ].map((r) => (
            <div key={r.role} className="flex gap-2 py-1.5">
              <span className="font-medium text-foreground w-32 shrink-0">{r.role}</span>
              <span>{r.perms}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    emailAlerts: true, smsAlerts: false, inAppAlerts: true,
    loadAssigned: true, loadDelivered: true, driverHos: true,
    safetyAlert: true, invoiceDue: true, settlementReady: false,
    quietHoursEnabled: false, quietStart: "22:00", quietEnd: "06:00", digestFrequency: "daily",
  });
  const setB = (k: keyof typeof prefs) => (v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));
  const setS = (k: keyof typeof prefs) => (v: string) => setPrefs((p) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Configure how and when you receive alerts from Apollo TMS.</p>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-2">
        <h3 className="text-sm font-semibold text-foreground mb-3">Delivery Channels</h3>
        <Toggle checked={prefs.inAppAlerts} onChange={setB("inAppAlerts")} label="In-App Notifications" description="Real-time alerts inside the dashboard" />
        <Toggle checked={prefs.emailAlerts} onChange={setB("emailAlerts")} label="Email Alerts" description="Summary and critical alerts via email" />
        <Toggle checked={prefs.smsAlerts} onChange={setB("smsAlerts")} label="SMS Alerts" description="Text message alerts for urgent events" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-2">
        <h3 className="text-sm font-semibold text-foreground mb-3">Alert Types</h3>
        <Toggle checked={prefs.loadAssigned} onChange={setB("loadAssigned")} label="Load Assigned" description="When a load is assigned to a driver" />
        <Toggle checked={prefs.loadDelivered} onChange={setB("loadDelivered")} label="Load Delivered" description="Delivery confirmation events" />
        <Toggle checked={prefs.driverHos} onChange={setB("driverHos")} label="HOS Warnings" description="Driver approaching hours-of-service limits" />
        <Toggle checked={prefs.safetyAlert} onChange={setB("safetyAlert")} label="Safety Alerts" description="Violations, inspections, and incidents" />
        <Toggle checked={prefs.invoiceDue} onChange={setB("invoiceDue")} label="Invoice Due Reminders" description="Upcoming or overdue invoice alerts" />
        <Toggle checked={prefs.settlementReady} onChange={setB("settlementReady")} label="Settlement Ready" description="When driver settlements are calculated" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Quiet Hours</h3>
        <Toggle checked={prefs.quietHoursEnabled} onChange={setB("quietHoursEnabled")} label="Enable Quiet Hours" description="Suppress non-critical alerts during specified times" />
        {prefs.quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Quiet Start"><input type="time" value={prefs.quietStart} onChange={(e) => setS("quietStart")(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" /></FieldGroup>
            <FieldGroup label="Quiet End"><input type="time" value={prefs.quietEnd} onChange={(e) => setS("quietEnd")(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" /></FieldGroup>
          </div>
        )}
        <FieldGroup label="Digest Frequency">
          <SelectInput value={prefs.digestFrequency} onChange={setS("digestFrequency")} options={[
            { value: "realtime", label: "Real-time" }, { value: "hourly", label: "Hourly" },
            { value: "daily", label: "Daily Summary" }, { value: "weekly", label: "Weekly Digest" },
          ]} />
        </FieldGroup>
      </div>
    </div>
  );
}

function IntegrationsSection() {
  const integrations = [
    { name: "Samsara ELD", category: "ELD / Telematics", status: "connected", lastSync: "2 min ago" },
    { name: "KeepTruckin", category: "ELD / Telematics", status: "disconnected", lastSync: "—" },
    { name: "Comdata Fuel Card", category: "Fuel Card", status: "connected", lastSync: "1 hr ago" },
    { name: "QuickBooks Online", category: "Accounting", status: "connected", lastSync: "15 min ago" },
    { name: "DAT Load Board", category: "Load Board", status: "disconnected", lastSync: "—" },
    { name: "Truckstop.com", category: "Load Board", status: "disconnected", lastSync: "—" },
    { name: "Twilio SMS", category: "Messaging", status: "connected", lastSync: "Live" },
    { name: "Google Maps API", category: "Mapping", status: "connected", lastSync: "Live" },
  ];
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Connect Apollo TMS with ELD providers, fuel cards, accounting software, and more.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {integrations.map((integration) => (
          <div key={integration.name} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium text-foreground">{integration.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{integration.category} · Last sync: {integration.lastSync}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", integration.status === "connected" ? "bg-apollo-cyan-100 text-apollo-cyan-700" : "bg-zinc-100 text-zinc-600")}>{integration.status}</span>
              <Button variant="ghost" size="sm" className="text-xs h-7">{integration.status === "connected" ? "Manage" : "Connect"}</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DisplaySection() {
  const [prefs, setPrefs] = useState({ theme: "system", dateFormat: "MM/DD/YYYY", timeFormat: "12h", distanceUnit: "miles", weightUnit: "lbs", currency: "USD", density: "comfortable" });
  const set = (k: keyof typeof prefs) => (v: string) => setPrefs((p) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Customize the look, feel, and regional formats for your account.</p>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldGroup label="Theme"><SelectInput value={prefs.theme} onChange={set("theme")} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System Default" }]} /></FieldGroup>
          <FieldGroup label="Layout Density"><SelectInput value={prefs.density} onChange={set("density")} options={[{ value: "compact", label: "Compact" }, { value: "comfortable", label: "Comfortable" }, { value: "spacious", label: "Spacious" }]} /></FieldGroup>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <h3 className="text-sm font-semibold text-foreground">Regional Formats</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FieldGroup label="Date Format"><SelectInput value={prefs.dateFormat} onChange={set("dateFormat")} options={[{ value: "MM/DD/YYYY", label: "MM/DD/YYYY" }, { value: "DD/MM/YYYY", label: "DD/MM/YYYY" }, { value: "YYYY-MM-DD", label: "YYYY-MM-DD" }]} /></FieldGroup>
          <FieldGroup label="Time Format"><SelectInput value={prefs.timeFormat} onChange={set("timeFormat")} options={[{ value: "12h", label: "12-Hour (AM/PM)" }, { value: "24h", label: "24-Hour" }]} /></FieldGroup>
          <FieldGroup label="Currency"><SelectInput value={prefs.currency} onChange={set("currency")} options={[{ value: "USD", label: "USD ($)" }, { value: "CAD", label: "CAD (C$)" }, { value: "MXN", label: "MXN (MX$)" }]} /></FieldGroup>
          <FieldGroup label="Distance Unit"><SelectInput value={prefs.distanceUnit} onChange={set("distanceUnit")} options={[{ value: "miles", label: "Miles" }, { value: "km", label: "Kilometers" }]} /></FieldGroup>
          <FieldGroup label="Weight Unit"><SelectInput value={prefs.weightUnit} onChange={set("weightUnit")} options={[{ value: "lbs", label: "Pounds (lbs)" }, { value: "kg", label: "Kilograms (kg)" }]} /></FieldGroup>
        </div>
      </div>
    </div>
  );
}

function SecuritySection() {
  const [mfa, setMfa] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("480");
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const set = (k: keyof typeof form) => (v: string) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Manage your password, two-factor authentication, and active sessions.</p>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
        <div className="space-y-3 max-w-sm">
          <FieldGroup label="Current Password"><TextInput value={form.current} onChange={set("current")} type="password" placeholder="••••••••" /></FieldGroup>
          <FieldGroup label="New Password"><TextInput value={form.next} onChange={set("next")} type="password" placeholder="••••••••" /></FieldGroup>
          <FieldGroup label="Confirm New Password"><TextInput value={form.confirm} onChange={set("confirm")} type="password" placeholder="••••••••" /></FieldGroup>
          <Button size="sm" className="mt-1">Update Password</Button>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Two-Factor Authentication</h3>
        <Toggle checked={mfa} onChange={setMfa} label="Enable 2FA" description="Require a verification code in addition to your password when signing in." />
        {mfa && <div className="rounded-xl border border-apollo-cyan-200 bg-apollo-cyan-50 px-4 py-3 text-xs text-apollo-cyan-700">2FA is enabled. Download an authenticator app (Google Authenticator, Authy) and scan the QR code to complete setup.</div>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Session Settings</h3>
        <div className="max-w-xs">
          <FieldGroup label="Session Timeout">
            <SelectInput value={sessionTimeout} onChange={setSessionTimeout} options={[
              { value: "60", label: "1 hour" }, { value: "240", label: "4 hours" },
              { value: "480", label: "8 hours" }, { value: "1440", label: "24 hours" }, { value: "0", label: "Never" },
            ]} />
          </FieldGroup>
        </div>
        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">Sign Out All Sessions</Button>
      </div>
    </div>
  );
}

function PrivacySection() {
  const [prefs, setPrefs] = useState({ auditLog: true, dataSharing: false, locationTracking: true, cookieAnalytics: true, autoLogout: true });
  const set = (k: keyof typeof prefs) => (v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));
  const logs = [
    { action: "User login", user: "mila@apollologistics.com", time: "Today 9:14 AM", ip: "73.245.48.12" },
    { action: "Order #010234 created", user: "james@apollologistics.com", time: "Today 8:53 AM", ip: "73.245.48.15" },
    { action: "Driver profile updated", user: "mila@apollologistics.com", time: "Yesterday 4:22 PM", ip: "73.245.48.12" },
    { action: "Settlement calculated", user: "sarah@apollologistics.com", time: "Yesterday 2:10 PM", ip: "73.245.48.20" },
  ];
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Control data access, audit logging, and privacy settings.</p>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-2">
        <h3 className="text-sm font-semibold text-foreground mb-3">Privacy Controls</h3>
        <Toggle checked={prefs.auditLog} onChange={set("auditLog")} label="Enable Audit Log" description="Record all user actions for compliance review" />
        <Toggle checked={prefs.locationTracking} onChange={set("locationTracking")} label="Driver Location Tracking" description="Real-time GPS position sharing from driver app" />
        <Toggle checked={prefs.cookieAnalytics} onChange={set("cookieAnalytics")} label="Analytics Cookies" description="Help improve Apollo TMS with anonymous usage data" />
        <Toggle checked={prefs.dataSharing} onChange={set("dataSharing")} label="Share Aggregated Data" description="Share anonymized fleet stats with Apollo's benchmarking program" />
        <Toggle checked={prefs.autoLogout} onChange={set("autoLogout")} label="Auto-Logout on Inactivity" description="Automatically sign out after session timeout" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Recent Audit Log</h3>
          <Button variant="outline" size="sm" className="text-xs h-7">Export CSV</Button>
        </div>
        <div className="divide-y divide-border text-xs">
          {logs.map((log, i) => (
            <div key={i} className="flex items-start justify-between gap-4 py-2">
              <div><p className="font-medium text-foreground">{log.action}</p><p className="text-muted-foreground mt-0.5">{log.user} · {log.ip}</p></div>
              <span className="shrink-0 text-muted-foreground">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataManagementSection() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Export data, manage imports, and configure retention policies.</p>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Export Data</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: "Orders (CSV)", description: "All orders with stops and status history" },
            { label: "Driver Records (CSV)", description: "Driver profiles, qualifications, and pay" },
            { label: "Invoices (PDF/CSV)", description: "All billing invoices and line items" },
            { label: "Settlement Reports (CSV)", description: "Driver settlement history" },
            { label: "Safety Log (CSV)", description: "Violations, inspections, and incidents" },
            { label: "Full Data Backup (ZIP)", description: "Complete account data archive" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-7 ml-3 shrink-0">Export</Button>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Data Retention</h3>
        <div className="max-w-xs">
          <FieldGroup label="Order Records Retention">
            <SelectInput value="7years" onChange={() => {}} options={[
              { value: "1year", label: "1 Year" }, { value: "3years", label: "3 Years" },
              { value: "7years", label: "7 Years (recommended)" }, { value: "indefinite", label: "Indefinite" },
            ]} />
          </FieldGroup>
        </div>
        <p className="text-xs text-muted-foreground">FMCSA requires motor carriers to retain driver qualification files for 3 years and accident reports for 3 years.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Demo Data</h3>
        <p className="text-sm text-muted-foreground">This account is running with sample data. You can reset or clear it at any time.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Reset Demo Data</Button>
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">Clear All Data</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Section map ──────────────────────────────────────────────────────────────

const sectionContent: Record<string, React.ReactNode> = {
  company: <CompanyProfileSection />,
  users: <UserManagementSection />,
  notifications: <NotificationsSection />,
  integrations: <IntegrationsSection />,
  display: <DisplaySection />,
  security: <SecuritySection />,
  privacy: <PrivacySection />,
  data: <DataManagementSection />,
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SectionPage({ tile, onBack }: { tile: SettingsTile; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="space-y-6 pb-12"
    >
      <div>
        <button type="button" onClick={onBack} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <tile.icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{tile.title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{tile.description}</p>
          </div>
        </div>
      </div>
      {sectionContent[tile.id]}
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const activeTile = settingsTiles.find((t) => t.id === activeSection);

  return (
    <AnimatePresence mode="wait">
      {activeTile ? (
        <SectionPage key={activeTile.id} tile={activeTile} onBack={() => setActiveSection(null)} />
      ) : (
        <motion.div key="tiles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }} className="space-y-6 pb-12"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your organization, team, integrations, and preferences.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {settingsTiles.map((tile, index) => (
              <motion.button key={tile.id} type="button" onClick={() => setActiveSection(tile.id)}
                className="group flex flex-col items-start rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, type: "spring", stiffness: 400, damping: 30 }}
                whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex w-full items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <tile.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CaretRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h2 className="mt-4 text-sm font-semibold text-foreground">{tile.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{tile.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
