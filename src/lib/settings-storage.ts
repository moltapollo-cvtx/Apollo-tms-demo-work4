export const APOLLO_SETTINGS_STORAGE_KEY = "apollo-tms-settings";

export type UserRole =
  | "Admin"
  | "Dispatcher"
  | "Driver Manager"
  | "Safety Manager"
  | "Accounting";

export type UserStatus = "active" | "inactive";

export interface SettingsUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  status: UserStatus;
}

export interface CompanyProfileSettings {
  companyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  logoDataUrl: string;
}

export type NotificationFrequency =
  | "real-time"
  | "hourly-digest"
  | "daily-digest";

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  dispatchAlerts: boolean;
  safetyAlerts: boolean;
  billingAlerts: boolean;
  maintenanceReminders: boolean;
  driverHosWarnings: boolean;
  frequency: NotificationFrequency;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export type EldProvider = "samsara" | "keeptruckin" | "omnitracs" | "none";
export type GpsProvider = "samsara" | "calamp" | "geotab" | "none";
export type FuelCardProvider = "comdata" | "efs" | "wex" | "none";

interface IntegrationOption<T extends string> {
  provider: T;
  apiKey: string;
}

export interface IntegrationsSettings {
  eld: IntegrationOption<EldProvider>;
  gps: IntegrationOption<GpsProvider>;
  fuelCard: IntegrationOption<FuelCardProvider>;
}

export type ThemePreference = "light" | "dark" | "system";
export type DashboardLayout = "compact" | "standard" | "expanded";
export type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
export type TimeFormat = "12hr" | "24hr";
export type DistanceUnit = "miles" | "kilometers";
export type CurrencyCode = "USD" | "CAD" | "MXN";

export interface DisplaySettings {
  theme: ThemePreference;
  sidebarCollapsedByDefault: boolean;
  dashboardLayout: DashboardLayout;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  distanceUnit: DistanceUnit;
  currency: CurrencyCode;
}

export type DataRetention = "30-days" | "90-days" | "1-year" | "forever";

export interface DataManagementSettings {
  retention: DataRetention;
}

export type SessionTimeout = "15-min" | "30-min" | "1-hr" | "4-hr" | "never";

export interface ActiveSession {
  id: string;
  browser: string;
  device: string;
  location: string;
  lastActive: string;
}

export interface LoginHistoryEntry {
  id: string;
  date: string;
  ip: string;
  device: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: SessionTimeout;
  activeSessions: ActiveSession[];
  loginHistory: LoginHistoryEntry[];
}

export interface ApolloSettings {
  companyProfile: CompanyProfileSettings;
  users: SettingsUser[];
  notifications: NotificationSettings;
  integrations: IntegrationsSettings;
  display: DisplaySettings;
  dataManagement: DataManagementSettings;
  security: SecuritySettings;
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? DeepPartial<U>[]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

const DEFAULT_SETTINGS: ApolloSettings = {
  companyProfile: {
    companyName: "Apollo Freight Solutions",
    address: "1450 Trinity Industrial Blvd",
    city: "Dallas",
    state: "TX",
    zip: "75247",
    phone: "(214) 555-0189",
    email: "operations@apollofreight.com",
    logoDataUrl: "",
  },
  users: [
    {
      id: "user-admin",
      name: "Ava Reynolds",
      role: "Admin",
      email: "ava.reynolds@apollofreight.com",
      phone: "(214) 555-0101",
      status: "active",
    },
    {
      id: "user-dispatcher",
      name: "Noah Jenkins",
      role: "Dispatcher",
      email: "noah.jenkins@apollofreight.com",
      phone: "(214) 555-0102",
      status: "active",
    },
    {
      id: "user-driver-manager",
      name: "Mia Collins",
      role: "Driver Manager",
      email: "mia.collins@apollofreight.com",
      phone: "(214) 555-0103",
      status: "active",
    },
    {
      id: "user-safety",
      name: "Liam Brooks",
      role: "Safety Manager",
      email: "liam.brooks@apollofreight.com",
      phone: "(214) 555-0104",
      status: "inactive",
    },
    {
      id: "user-accounting",
      name: "Emma Diaz",
      role: "Accounting",
      email: "emma.diaz@apollofreight.com",
      phone: "(214) 555-0105",
      status: "active",
    },
  ],
  notifications: {
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    dispatchAlerts: true,
    safetyAlerts: true,
    billingAlerts: true,
    maintenanceReminders: true,
    driverHosWarnings: true,
    frequency: "real-time",
    quietHoursStart: "22:00",
    quietHoursEnd: "06:00",
  },
  integrations: {
    eld: {
      provider: "samsara",
      apiKey: "",
    },
    gps: {
      provider: "geotab",
      apiKey: "",
    },
    fuelCard: {
      provider: "comdata",
      apiKey: "",
    },
  },
  display: {
    theme: "system",
    sidebarCollapsedByDefault: false,
    dashboardLayout: "standard",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12hr",
    distanceUnit: "miles",
    currency: "USD",
  },
  dataManagement: {
    retention: "90-days",
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: "30-min",
    activeSessions: [
      {
        id: "session-1",
        browser: "Chrome 134",
        device: "MacBook Pro",
        location: "Dallas, TX",
        lastActive: "2 minutes ago",
      },
      {
        id: "session-2",
        browser: "Safari 17",
        device: "iPhone 15",
        location: "Dallas, TX",
        lastActive: "18 minutes ago",
      },
      {
        id: "session-3",
        browser: "Edge 132",
        device: "Windows Desktop",
        location: "Fort Worth, TX",
        lastActive: "1 hour ago",
      },
    ],
    loginHistory: [
      {
        id: "login-1",
        date: "2026-03-01 08:42",
        ip: "172.16.44.11",
        device: "Chrome on macOS",
      },
      {
        id: "login-2",
        date: "2026-02-28 21:07",
        ip: "172.16.44.11",
        device: "Safari on iOS",
      },
      {
        id: "login-3",
        date: "2026-02-28 07:15",
        ip: "172.16.44.16",
        device: "Edge on Windows",
      },
      {
        id: "login-4",
        date: "2026-02-27 19:33",
        ip: "172.16.44.11",
        device: "Chrome on macOS",
      },
      {
        id: "login-5",
        date: "2026-02-27 05:10",
        ip: "172.16.44.99",
        device: "Firefox on Linux",
      },
    ],
  },
};

function cloneSettings(settings: ApolloSettings): ApolloSettings {
  return JSON.parse(JSON.stringify(settings)) as ApolloSettings;
}

export function createDefaultApolloSettings(): ApolloSettings {
  return cloneSettings(DEFAULT_SETTINGS);
}

export function mergeApolloSettings(
  value: DeepPartial<ApolloSettings> | null | undefined,
): ApolloSettings {
  const partial = value ?? {};

  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    companyProfile: {
      ...DEFAULT_SETTINGS.companyProfile,
      ...(partial.companyProfile ?? {}),
    },
    users: Array.isArray(partial.users)
      ? (partial.users as SettingsUser[])
      : cloneSettings(DEFAULT_SETTINGS).users,
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(partial.notifications ?? {}),
    },
    integrations: {
      eld: {
        ...DEFAULT_SETTINGS.integrations.eld,
        ...(partial.integrations?.eld ?? {}),
      },
      gps: {
        ...DEFAULT_SETTINGS.integrations.gps,
        ...(partial.integrations?.gps ?? {}),
      },
      fuelCard: {
        ...DEFAULT_SETTINGS.integrations.fuelCard,
        ...(partial.integrations?.fuelCard ?? {}),
      },
    },
    display: {
      ...DEFAULT_SETTINGS.display,
      ...(partial.display ?? {}),
    },
    dataManagement: {
      ...DEFAULT_SETTINGS.dataManagement,
      ...(partial.dataManagement ?? {}),
    },
    security: {
      ...DEFAULT_SETTINGS.security,
      ...(partial.security ?? {}),
      activeSessions: Array.isArray(partial.security?.activeSessions)
        ? (partial.security.activeSessions as ActiveSession[])
        : cloneSettings(DEFAULT_SETTINGS).security.activeSessions,
      loginHistory: Array.isArray(partial.security?.loginHistory)
        ? (partial.security.loginHistory as LoginHistoryEntry[])
        : cloneSettings(DEFAULT_SETTINGS).security.loginHistory,
    },
  };
}

export function loadApolloSettings(): ApolloSettings {
  if (typeof window === "undefined") {
    return createDefaultApolloSettings();
  }

  try {
    const rawValue = localStorage.getItem(APOLLO_SETTINGS_STORAGE_KEY);
    if (!rawValue) {
      return createDefaultApolloSettings();
    }

    const parsedValue = JSON.parse(rawValue) as DeepPartial<ApolloSettings>;
    return mergeApolloSettings(parsedValue);
  } catch {
    return createDefaultApolloSettings();
  }
}

export function saveApolloSettings(settings: ApolloSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(APOLLO_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function resetApolloSettingsStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(APOLLO_SETTINGS_STORAGE_KEY);
}
