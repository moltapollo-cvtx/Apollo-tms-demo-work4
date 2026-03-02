"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowClockwise,
  Clock,
  ClockCounterClockwise,
  Crosshair,
  Gauge,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  NavigationArrow,
  Package,
  SquaresFour,
  TrendUp,
  Truck,
  User,
  Warning,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  buildFleetDrivers,
  filterFleetDrivers,
  statusLabel,
  type DriverInfo,
  type FleetFilter,
  type MapTheme,
} from "@/components/fleet-map/driver-telemetry";

const FleetMapComponent = dynamic(
  () => import("@/components/fleet-map/fleet-map-component"),
  {
    ssr: false,
    loading: () => (
      <div className="fleet-map-loading flex h-full items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-apollo-cyan-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Preparing command view...</p>
        </div>
      </div>
    ),
  }
);

const FILTERS: { id: FleetFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "driving", label: "Driving" },
  { id: "available", label: "Available" },
  { id: "at_risk", label: "At Risk" },
];

const MAP_THEMES: { id: MapTheme; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "night", label: "Night" },
  { id: "satellite", label: "Satellite" },
];

const STATUS_TONE: Record<
  DriverInfo["status"],
  { dot: string; chip: string; text: string }
> = {
  available: {
    dot: "bg-apollo-cyan-500",
    chip: "border-apollo-cyan-200 bg-apollo-cyan-50 text-apollo-cyan-700",
    text: "text-apollo-cyan-700",
  },
  on_duty: {
    dot: "bg-amber-500",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    text: "text-amber-700",
  },
  off_duty: {
    dot: "bg-rose-500",
    chip: "border-rose-200 bg-rose-50 text-rose-700",
    text: "text-rose-700",
  },
  driving: {
    dot: "bg-blue-500",
    chip: "border-blue-200 bg-blue-50 text-blue-700",
    text: "text-blue-700",
  },
};

function StatusDot({ status }: { status: DriverInfo["status"] }) {
  return <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_TONE[status].dot)} />;
}

function DashboardMetric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "neutral" | "positive" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "from-apollo-cyan-50 to-cyan-50 border-apollo-cyan-200"
      : tone === "warning"
      ? "from-amber-50 to-orange-50 border-amber-200"
      : "from-slate-50 to-white border-slate-200";

  return (
    <div className={cn("rounded-2xl border bg-gradient-to-br p-3.5", toneClass)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</span>
        <span className="rounded-lg bg-white/80 p-1.5 text-slate-600">{icon}</span>
      </div>
      <p className="mt-3 text-xl font-semibold text-slate-900 md:text-2xl">{value}</p>
    </div>
  );
}

function DriverRow({
  driver,
  selected,
  followed,
  onSelect,
  onFollow,
}: {
  driver: DriverInfo;
  selected: boolean;
  followed: boolean;
  onSelect: () => void;
  onFollow: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group relative w-full cursor-pointer rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apollo-cyan-500/30",
        selected
          ? "border-apollo-cyan-300 bg-apollo-cyan-50/85 shadow-[0_10px_26px_-18px_rgba(2,132,199,0.95)]"
          : "border-slate-200 bg-white/85 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"
      )}
    >
      {selected && <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-apollo-cyan-500" />}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl border border-white bg-slate-900 px-2 py-1 font-mono text-[11px] font-semibold text-cyan-100 shadow-sm">
          {driver.tractorUnit.replace(/^TRC-?/, "")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <StatusDot status={driver.status} />
            <p className="truncate text-sm font-semibold text-slate-900">
              {driver.firstName} {driver.lastName}
            </p>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{driver.homeTerminal}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            HOS {driver.hosRemaining}h
            {driver.currentLoad !== "—" && (
              <>
                <span className="text-slate-300">|</span>
                <Package className="h-3.5 w-3.5" />
                {driver.currentLoad}
              </>
            )}
          </div>
        </div>

        <button
          onClick={(event) => {
            event.stopPropagation();
            onFollow();
          }}
          className={cn(
            "rounded-xl border px-2 py-1 text-[11px] font-semibold transition-colors",
            followed
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600 group-hover:border-slate-300"
          )}
        >
          {followed ? "Following" : "Follow"}
        </button>
      </div>
    </div>
  );
}

function DriverPanel({
  driver,
  isFollowing,
  onClose,
  onFollow,
  onAssignLoad,
  onViewProfile,
}: {
  driver: DriverInfo;
  isFollowing: boolean;
  onClose: () => void;
  onFollow: (id: number | null) => void;
  onAssignLoad: (id: number) => void;
  onViewProfile: (id: number) => void;
}) {
  const hosAtRisk = driver.hosRemaining < 5;

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="absolute inset-x-2 bottom-2 z-[550] max-h-[82%] overflow-hidden rounded-3xl border border-white/60 bg-white/96 shadow-2xl backdrop-blur-xl md:inset-y-4 md:bottom-auto md:left-auto md:right-4 md:w-[380px]"
    >
      <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 px-4 py-4 text-white">
        <div className="rounded-xl border border-white/30 bg-white/10 px-2 py-1 font-mono text-xs font-semibold">
          {driver.tractorUnit}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {driver.firstName} {driver.lastName}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-cyan-100">
            <StatusDot status={driver.status} />
            {statusLabel(driver.status)}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Signal</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{driver.signalStrength}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">ETA</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{driver.eta}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-slate-500">Live Assignment</p>
          {driver.currentLoad !== "—" ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Package className="h-4 w-4 text-apollo-cyan-600" />
                {driver.currentLoad}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <NavigationArrow className="h-3.5 w-3.5" />
                Route updating every 2.6s
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No active load assigned.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-slate-500">Hours Of Service</p>
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>Remaining</span>
            <span className={cn("font-mono text-sm font-semibold", hosAtRisk ? "text-amber-700" : "text-slate-900")}>
              {driver.hosRemaining}h / 11h
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn("h-full rounded-full", hosAtRisk ? "bg-amber-500" : "bg-apollo-cyan-500")}
              style={{ width: `${Math.min(100, Math.max(0, (driver.hosRemaining / 11) * 100))}%` }}
            />
          </div>
          {hosAtRisk && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
              <Warning className="h-3.5 w-3.5" weight="fill" />
              Driver is approaching HOS threshold.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-slate-500">Driver Profile</p>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span>Home Terminal</span>
              <span className="font-medium text-slate-900">{driver.homeTerminal}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>CDL Endorsements</span>
              <span className="font-mono text-slate-900">
                {driver.cdlEndorsements.length > 0 ? driver.cdlEndorsements.join(" · ") : "None"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => onFollow(isFollowing ? null : driver.id)}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all",
              isFollowing
                ? "border border-blue-200 bg-blue-50 text-blue-700"
                : "bg-slate-900 text-white hover:bg-slate-800"
            )}
          >
            <Crosshair className="h-4 w-4" />
            {isFollowing ? "Stop Following" : "Follow Truck"}
          </button>
          <button
            onClick={() => onAssignLoad(driver.id)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-apollo-cyan-200 bg-gradient-to-r from-apollo-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <Truck className="h-4 w-4" />
            Assign New Load
          </button>
          <button
            onClick={() => onViewProfile(driver.id)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
          >
            <User className="h-4 w-4" />
            View Driver Profile
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function FleetMapPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FleetFilter>("all");
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [followingDriverId, setFollowingDriverId] = useState<number | null>(null);
  const [mapTheme, setMapTheme] = useState<MapTheme>("light");
  const [showGeofences, setShowGeofences] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showTrafficPulse, setShowTrafficPulse] = useState(true);
  const [now, setNow] = useState(() => new Date());

  const drivers = useMemo(() => buildFleetDrivers(), []);

  const visibleDrivers = useMemo(
    () => filterFleetDrivers(drivers, filter, searchQuery),
    [drivers, filter, searchQuery]
  );

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === selectedDriverId) ?? null,
    [drivers, selectedDriverId]
  );

  const followedDriver = useMemo(
    () => drivers.find((driver) => driver.id === followingDriverId) ?? null,
    [drivers, followingDriverId]
  );

  const statusCounts = useMemo(
    () => ({
      driving: drivers.filter((driver) => driver.status === "driving").length,
      available: drivers.filter((driver) => driver.status === "available").length,
      onDuty: drivers.filter((driver) => driver.status === "on_duty").length,
      risk: drivers.filter((driver) => driver.hosRemaining < 5).length,
    }),
    [drivers]
  );

  const avgEta = useMemo(() => {
    const minutes = drivers.filter((driver) => driver.status === "driving").map((driver) => driver.etaMinutes);
    if (minutes.length === 0) return "—";

    const average = Math.round(minutes.reduce((sum, current) => sum + current, 0) / minutes.length);
    const hour = Math.floor(average / 60);
    return `${hour}h ${average % 60}m`;
  }, [drivers]);

  const liveSignals = useMemo(
    () =>
      drivers
        .filter((driver) => driver.status === "driving")
        .slice(0, 3)
        .map((driver) => ({
          id: driver.id,
          label: `${driver.firstName} ${driver.lastName}`,
          text: `${driver.currentLoad} · ETA ${driver.eta}`,
          tone: STATUS_TONE[driver.status].text,
          status: statusLabel(driver.status),
        })),
    [drivers]
  );

  useEffect(() => {
    document.title = "Live Fleet Map | Apollo TMS";
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const timestamp = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(now);

  const handleAssignLoad = (driverId: number) => {
    setSelectedDriverId(null);
    router.push(`/dispatch?driverId=${driverId}&mode=assign`);
  };

  const handleViewDriverProfile = (driverId: number) => {
    router.push(`/drivers/${driverId}`);
  };

  return (
    <div className="relative -mx-3 -mt-3 md:-mx-6 md:-mt-6 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_#d8f4ff_0%,_#eff8ff_40%,_#f8fafc_74%)]">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-apollo-cyan-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-sky-100/80 blur-3xl" />

      <header className="relative z-20 border-b border-white/70 bg-white/70 backdrop-blur-xl">
        <div className="px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl border border-white bg-slate-900 p-2 text-cyan-100 shadow-sm">
                  <MapTrifold className="h-5 w-5" weight="duotone" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900 md:text-xl">Fleet Command Center</h1>
                  <p className="text-xs text-slate-500 md:text-sm">
                    Live carrier intelligence, lane monitoring, and dispatch control
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600">
              <ClockCounterClockwise className="h-4 w-4 text-apollo-cyan-600" />
              Updated {timestamp}
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetric
              icon={<SquaresFour className="h-4 w-4" />}
              label="Fleet Online"
              value={`${drivers.filter((driver) => driver.status !== "off_duty").length}/${drivers.length}`}
              tone="neutral"
            />
            <DashboardMetric
              icon={<NavigationArrow className="h-4 w-4" />}
              label="Active Routes"
              value={String(statusCounts.driving)}
              tone="positive"
            />
            <DashboardMetric
              icon={<TrendUp className="h-4 w-4" />}
              label="Network Avg ETA"
              value={avgEta}
              tone="positive"
            />
            <DashboardMetric
              icon={<Warning className="h-4 w-4" />}
              label="HOS Risk Drivers"
              value={String(statusCounts.risk)}
              tone={statusCounts.risk > 0 ? "warning" : "neutral"}
            />
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 gap-4 p-3 md:p-5">
        <aside className="hidden w-[330px] shrink-0 flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/82 shadow-xl backdrop-blur-xl lg:flex">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search driver or unit"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-apollo-cyan-400 focus:ring-2 focus:ring-apollo-cyan-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="mt-3 flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all",
                    filter === item.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between px-4 py-3 text-xs font-medium uppercase tracking-[0.09em] text-slate-500">
              <span>Mission Queue</span>
              <span>{visibleDrivers.length} Units</span>
            </div>
            <div className="space-y-2 overflow-y-auto px-3 pb-3">
              {visibleDrivers.map((driver) => (
                <DriverRow
                  key={driver.id}
                  driver={driver}
                  selected={selectedDriverId === driver.id}
                  followed={followingDriverId === driver.id}
                  onSelect={() => setSelectedDriverId(driver.id)}
                  onFollow={() => setFollowingDriverId((previous) => (previous === driver.id ? null : driver.id))}
                />
              ))}

              {visibleDrivers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
                  No drivers match current filters.
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="rounded-2xl border border-white/70 bg-white/75 p-2.5 backdrop-blur-xl lg:hidden">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search driver or unit"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-apollo-cyan-400 focus:ring-2 focus:ring-apollo-cyan-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-1">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold",
                    filter === item.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="fleet-map-shell relative min-h-[50vh] flex-1 overflow-hidden rounded-2xl md:rounded-[2rem] border border-white/80 shadow-2xl">
            <FleetMapComponent
              filter={filter}
              searchQuery={searchQuery}
              followDriverId={followingDriverId}
              selectedDriverId={selectedDriverId}
              mapTheme={mapTheme}
              showGeofences={showGeofences}
              showRoutes={showRoutes}
              showTrafficPulse={showTrafficPulse}
              onDriverSelect={setSelectedDriverId}
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/8 via-transparent to-slate-900/20" />

            <div className="absolute left-3 top-3 z-[450] w-[260px] rounded-2xl border border-white/50 bg-white/90 p-3 shadow-lg backdrop-blur-xl sm:w-[300px]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Live Signals</p>
                <button
                  onClick={() => setNow(new Date())}
                  className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Refresh live signal cards"
                >
                  <ArrowClockwise className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                {liveSignals.map((signal, index) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    onClick={() => setSelectedDriverId(signal.id)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-2.5 py-2 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                  >
                    <p className="text-xs font-semibold text-slate-900">{signal.label}</p>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">{signal.status}</p>
                    <p className={cn("text-[11px]", signal.tone)}>{signal.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="absolute right-3 top-3 z-[450] w-[255px] rounded-2xl border border-white/60 bg-white/90 p-3 shadow-lg backdrop-blur-xl sm:w-[280px]">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Map Controls</p>

              <div className="mb-2 grid grid-cols-3 gap-1">
                {MAP_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setMapTheme(theme.id)}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors",
                      mapTheme === theme.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => setShowRoutes((value) => !value)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-600 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <NavigationArrow className="h-3.5 w-3.5" />
                    Route Layer
                  </span>
                  <span className={cn("font-semibold", showRoutes ? "text-slate-900" : "text-slate-400")}>
                    {showRoutes ? "On" : "Off"}
                  </span>
                </button>
                <button
                  onClick={() => setShowGeofences((value) => !value)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-600 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    Geofences
                  </span>
                  <span className={cn("font-semibold", showGeofences ? "text-slate-900" : "text-slate-400")}>
                    {showGeofences ? "On" : "Off"}
                  </span>
                </button>
                <button
                  onClick={() => setShowTrafficPulse((value) => !value)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-600 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <Gauge className="h-3.5 w-3.5" />
                    Motion Pulse
                  </span>
                  <span className={cn("font-semibold", showTrafficPulse ? "text-slate-900" : "text-slate-400")}>
                    {showTrafficPulse ? "On" : "Off"}
                  </span>
                </button>
              </div>
            </div>

            <div className="absolute bottom-3 left-3 z-[450] rounded-2xl border border-white/60 bg-white/90 px-3 py-2 text-xs shadow-lg backdrop-blur-xl">
              <div className="flex flex-wrap items-center gap-2.5">
                {([
                  { key: "driving", label: "Driving", count: statusCounts.driving },
                  { key: "available", label: "Available", count: statusCounts.available },
                  { key: "on_duty", label: "On Duty", count: statusCounts.onDuty },
                ] as const).map((item) => (
                  <span
                    key={item.key}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2 py-0.5",
                      STATUS_TONE[item.key].chip
                    )}
                  >
                    <StatusDot status={item.key} />
                    {item.label} {item.count}
                  </span>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {followedDriver && (
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-2xl border border-blue-200 bg-white/95 px-4 py-2 text-sm shadow-lg backdrop-blur-xl"
                >
                  <div className="flex items-center gap-2 text-blue-700">
                    <Crosshair className="h-4 w-4" />
                    Following {followedDriver.firstName} {followedDriver.lastName}
                    <button
                      onClick={() => setFollowingDriverId(null)}
                      className="rounded-md p-1 text-blue-500 hover:bg-blue-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {selectedDriver && (
                <DriverPanel
                  driver={selectedDriver}
                  isFollowing={followingDriverId === selectedDriver.id}
                  onClose={() => setSelectedDriverId(null)}
                  onFollow={setFollowingDriverId}
                  onAssignLoad={handleAssignLoad}
                  onViewProfile={handleViewDriverProfile}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .fleet-map-shell .leaflet-control-zoom,
        .fleet-map-shell .leaflet-control-attribution {
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
          backdrop-filter: blur(8px);
          border-radius: 14px;
          overflow: hidden;
        }

        .fleet-map-shell .leaflet-control-zoom a {
          background: rgba(255, 255, 255, 0.95);
          color: #0f172a;
          border: none;
          width: 30px;
          height: 30px;
          line-height: 30px;
        }

        .fleet-map-shell .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.9);
          font-size: 10px;
          color: #334155;
        }

        .fleet-map-shell .leaflet-popup-content-wrapper {
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.2);
        }

        .fleet-map-shell .leaflet-popup-content {
          margin: 10px 12px;
        }

        .fleet-popup__content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-family: var(--font-geist-sans);
          min-width: 168px;
          color: #0f172a;
        }

        .fleet-popup__content strong {
          font-size: 12px;
        }

        .fleet-popup__content span {
          font-size: 11px;
          color: #475569;
        }

        .fleet-map-loading {
          background: radial-gradient(circle at 20% 10%, #d6f2ff 0%, #eff7ff 45%, #f8fafc 100%);
        }
      `}</style>
    </div>
  );
}
