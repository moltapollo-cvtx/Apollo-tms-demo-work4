import { mockDrivers, mockTractors } from "@/lib/mock-data";

export type DriverStatus = "available" | "on_duty" | "off_duty" | "driving";
export type FleetFilter = "all" | "available" | "driving" | "at_risk";
export type MapTheme = "light" | "satellite" | "night";

export interface DriverInfo {
  id: number;
  firstName: string;
  lastName: string;
  status: DriverStatus;
  homeTerminal: string;
  cdlEndorsements: string[];
  hosRemaining: number;
  tractorUnit: string;
  currentLoad: string;
  eta: string;
  etaMinutes: number;
  signalStrength: number;
}

function seededRatio(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

function seededRange(seed: number, min: number, max: number): number {
  return min + seededRatio(seed) * (max - min);
}

function normalizeStatus(value: string): DriverStatus {
  if (value === "available" || value === "on_duty" || value === "off_duty" || value === "driving") {
    return value;
  }
  return "available";
}

function formatEta(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function buildFleetDrivers(): DriverInfo[] {
  return mockDrivers.map((driver) => {
    const status = normalizeStatus(driver.status);
    const tractor = mockTractors.find((t) => t.currentDriverId === driver.id);

    const hosRemaining = Number(
      (
        status === "off_duty"
          ? seededRange(driver.id * 1.6, 1.2, 5.2)
          : seededRange(driver.id * 1.4, 3.8, 10.8)
      ).toFixed(1)
    );

    const etaMinutes = status === "driving" ? Math.round(seededRange(driver.id * 2.7, 55, 300)) : 0;

    return {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      status,
      homeTerminal: driver.homeTerminal,
      cdlEndorsements: ((driver as Record<string, unknown>).cdlEndorsements as string[] | undefined) ?? [],
      hosRemaining,
      tractorUnit: tractor?.unitNumber ?? "TRC-NA",
      currentLoad: status === "driving" ? `0${(10000 + driver.id).toString()}` : "—",
      eta: status === "driving" ? formatEta(etaMinutes) : "—",
      etaMinutes,
      signalStrength: Math.round(seededRange(driver.id * 3.2, 72, 99)),
    };
  });
}

export function filterFleetDrivers(
  drivers: DriverInfo[],
  filter: FleetFilter,
  searchQuery: string
): DriverInfo[] {
  const query = searchQuery.trim().toLowerCase();

  return drivers.filter((driver) => {
    if (filter === "available" && driver.status !== "available") return false;
    if (filter === "driving" && driver.status !== "driving") return false;
    if (filter === "at_risk" && !(driver.hosRemaining < 5 || driver.status === "off_duty")) return false;

    if (!query) return true;

    const fullName = `${driver.firstName} ${driver.lastName}`.toLowerCase();
    return fullName.includes(query) || driver.tractorUnit.toLowerCase().includes(query);
  });
}

export function statusLabel(status: DriverStatus): string {
  return status.replace("_", " ").replace(/^\w/, (char) => char.toUpperCase());
}
