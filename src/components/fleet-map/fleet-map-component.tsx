"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ROUTE_DESTINATIONS } from "./route-data";
import {
  buildFleetDrivers,
  filterFleetDrivers,
  type DriverInfo,
  type FleetFilter,
  type MapTheme,
} from "./driver-telemetry";

export const DRIVER_POSITIONS: Record<number, [number, number]> = {
  1: [32.7767, -96.7970],
  2: [34.8520, -112.4580],
  3: [41.1280, -90.5300],
  4: [25.7617, -80.1918],
  5: [47.6062, -122.3321],
  6: [33.7490, -84.3880],
  7: [33.8900, -109.2000],
  8: [39.7392, -104.9903],
  9: [36.1699, -115.1398],
  10: [45.5051, -122.6750],
  11: [36.1627, -86.7816],
  12: [38.2500, -91.8800],
  13: [35.2271, -80.8431],
  14: [35.9606, -83.9207],
  15: [39.9612, -82.9988],
  16: [38.0293, -78.4770],
  17: [29.7604, -95.3698],
  18: [41.2565, -95.9345],
  19: [44.9778, -93.2650],
  20: [30.2672, -97.7431],
};

const MAP_THEME_CONFIG: Record<
  MapTheme,
  { url: string; attribution: string; subdomains?: string[]; maxZoom?: number }
> = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: ["a", "b", "c", "d"],
    maxZoom: 20,
  },
  night: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: ["a", "b", "c", "d"],
    maxZoom: 20,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 19,
  },
};

const STATUS_STYLE: Record<
  DriverInfo["status"],
  { chip: string; border: string; text: string; route: string }
> = {
  available: { chip: "#00B4D8", border: "#008FB2", text: "#0077B6", route: "#00B4D8" },
  on_duty: { chip: "#F59E0B", border: "#D97706", text: "#B45309", route: "#F59E0B" },
  off_duty: { chip: "#EF4444", border: "#DC2626", text: "#B91C1C", route: "#EF4444" },
  driving: { chip: "#2563EB", border: "#1D4ED8", text: "#1E40AF", route: "#2563EB" },
};

const GEOFENCES = [
  { center: [32.7767, -96.7970] as [number, number], name: "Dallas Hub", radius: 80000 },
  { center: [41.8781, -87.6298] as [number, number], name: "Chicago Hub", radius: 90000 },
  { center: [34.0522, -118.2437] as [number, number], name: "LA Hub", radius: 100000 },
  { center: [33.7490, -84.3880] as [number, number], name: "Atlanta Hub", radius: 75000 },
  { center: [39.7392, -104.9903] as [number, number], name: "Denver Hub", radius: 70000 },
];

const CORRIDOR_PATHS: [number, number][][] = [
  [
    [34.0522, -118.2437],
    [39.7392, -104.9903],
    [41.8781, -87.6298],
  ],
  [
    [47.6062, -122.3321],
    [39.7392, -104.9903],
    [33.7490, -84.3880],
  ],
  [
    [32.7767, -96.7970],
    [39.7392, -104.9903],
    [45.5051, -122.6750],
  ],
];

function seededOffset(seed: number): number {
  const x = Math.sin(seed * 17.297 + 41.123) * 143758.5453123;
  return x - Math.floor(x);
}

function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function generateRoute(
  from: [number, number],
  to: [number, number],
  seed: number
): [number, number][] {
  const points: [number, number][] = [from];
  const segments = 7;

  for (let i = 1; i < segments; i += 1) {
    const t = i / segments;
    const arc = Math.sin(t * Math.PI);
    const latVariance = (seededOffset(seed + i * 3.1) - 0.5) * 0.62;
    const lonVariance = (seededOffset(seed + i * 8.4) - 0.5) * 0.62;

    points.push([
      from[0] + (to[0] - from[0]) * t + arc * latVariance,
      from[1] + (to[1] - from[1]) * t + arc * lonVariance,
    ]);
  }

  points.push(to);
  return points;
}

function createTruckIcon(driver: DriverInfo, isFollowed: boolean, isSelected: boolean) {
  const tone = STATUS_STYLE[driver.status];
  const glow = isFollowed || isSelected;
  const plate = driver.tractorUnit.replace(/^TRC-?/, "");

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-2px);">
      <div style="
        position:relative;
        width:38px;height:38px;
        border-radius:12px;
        background:linear-gradient(155deg, ${tone.chip} 0%, ${tone.border} 100%);
        border:2px solid white;
        display:flex;align-items:center;justify-content:center;
        box-shadow:${glow ? `0 0 0 6px ${tone.chip}22, 0 10px 24px ${tone.chip}55` : "0 8px 14px rgba(15, 23, 42, 0.28)"};
      ">
        <svg viewBox="0 0 24 18" width="21" height="16" fill="none" aria-hidden="true">
          <rect x="1" y="3" width="13" height="9" rx="1.5" fill="white"/>
          <path d="M14 5h4l4 4v4h-8V5z" fill="white" opacity="0.88"/>
          <rect x="16" y="6" width="3" height="3" rx="0.5" fill="${tone.chip}" opacity="0.45"/>
          <circle cx="5.5" cy="14.5" r="2" fill="white"/>
          <circle cx="5.5" cy="14.5" r="0.8" fill="${tone.chip}"/>
          <circle cx="18" cy="14.5" r="2" fill="white"/>
          <circle cx="18" cy="14.5" r="0.8" fill="${tone.chip}"/>
        </svg>
      </div>
      <div style="
        margin-top:3px;
        background:rgba(15,23,42,0.9);
        color:#e2f8ff;
        border:1px solid ${tone.chip}88;
        border-radius:999px;
        padding:0 6px;
        font-size:9px;
        line-height:14px;
        font-weight:700;
        letter-spacing:.03em;
        font-family:ui-monospace, monospace;
        white-space:nowrap;
      ">${plate}</div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [38, 56],
    iconAnchor: [19, 40],
    popupAnchor: [0, -36],
  });
}

function createCountBadge(count: number) {
  return L.divIcon({
    html: `<div style="
      background:linear-gradient(145deg,#0f172a,#1e293b);
      color:#8ef4ff;
      width:28px;height:28px;border-radius:999px;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;font-family:ui-monospace,monospace;
      border:2px solid rgba(255,255,255,0.95);
      box-shadow:0 6px 14px rgba(15,23,42,0.3);
    ">${count}</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function MapFollower({
  driverId,
  positions,
}: {
  driverId: number | null;
  positions: Record<number, [number, number]>;
}) {
  const map = useMap();

  useEffect(() => {
    if (driverId === null) return;
    const pos = positions[driverId];
    if (pos) {
      map.flyTo(pos, Math.max(map.getZoom(), 6), {
        animate: true,
        duration: 1.1,
      });
    }
  }, [driverId, positions, map]);

  return null;
}

function MapSetView() {
  const map = useMap();

  useEffect(() => {
    map.setView([38.5, -96.5], 4);
  }, [map]);

  return null;
}

function useAnimatedPositions(drivers: DriverInfo[]) {
  const [positions, setPositions] = useState<Record<number, [number, number]>>({
    ...DRIVER_POSITIONS,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) => {
        const next = { ...prev };

        drivers.forEach((driver) => {
          if (driver.status !== "driving") return;

          const [lat, lng] = prev[driver.id] ?? DRIVER_POSITIONS[driver.id] ?? [39, -98];
          const destination = ROUTE_DESTINATIONS[driver.id]?.pos;

          if (!destination) {
            next[driver.id] = [
              lat + (Math.random() - 0.5) * 0.02,
              lng + (Math.random() - 0.5) * 0.02,
            ];
            return;
          }

          const latStep = (destination[0] - lat) * 0.015 + (Math.random() - 0.5) * 0.01;
          const lonStep = (destination[1] - lng) * 0.015 + (Math.random() - 0.5) * 0.01;
          next[driver.id] = [lat + latStep, lng + lonStep];
        });

        return next;
      });
    }, 2600);

    return () => clearInterval(interval);
  }, [drivers]);

  return positions;
}

interface FleetMapComponentProps {
  filter: FleetFilter;
  searchQuery: string;
  followDriverId: number | null;
  selectedDriverId: number | null;
  mapTheme: MapTheme;
  showGeofences: boolean;
  showRoutes: boolean;
  showTrafficPulse: boolean;
  onDriverSelect: (driverId: number | null) => void;
}

export default function FleetMapComponent({
  filter,
  searchQuery,
  followDriverId,
  selectedDriverId,
  mapTheme,
  showGeofences,
  showRoutes,
  showTrafficPulse,
  onDriverSelect,
}: FleetMapComponentProps) {
  const drivers = useMemo(() => buildFleetDrivers(), []);
  const positions = useAnimatedPositions(drivers);

  const visibleDrivers = useMemo(
    () => filterFleetDrivers(drivers, filter, searchQuery),
    [drivers, filter, searchQuery]
  );

  const geofenceCounts = useMemo(
    () =>
      GEOFENCES.map((geofence) => {
        const count = drivers.filter((driver) => {
          const position = positions[driver.id] ?? DRIVER_POSITIONS[driver.id];
          if (!position) return false;
          return distanceKm(geofence.center, position) <= geofence.radius / 1000;
        }).length;

        return { ...geofence, count };
      }),
    [drivers, positions]
  );

  const selectedDriver =
    selectedDriverId === null ? null : drivers.find((driver) => driver.id === selectedDriverId) ?? null;

  const selectedRoute = useMemo(() => {
    if (!selectedDriver) return null;

    const startPos = DRIVER_POSITIONS[selectedDriver.id] ?? [39, -98];
    const destination = ROUTE_DESTINATIONS[selectedDriver.id]?.pos;
    if (!destination) return null;

    const base = generateRoute(startPos, destination, selectedDriver.id * 1.9);
    const current = positions[selectedDriver.id];

    return current ? ([current, ...base.slice(1)] as [number, number][]) : base;
  }, [selectedDriver, positions]);

  const networkRoutes = useMemo(() => {
    if (!showRoutes) return [] as { id: number; points: [number, number][]; color: string }[];

    return drivers
      .filter((driver) => driver.status === "driving")
      .slice(0, 8)
      .map((driver) => {
        const from = positions[driver.id] ?? DRIVER_POSITIONS[driver.id] ?? [39, -98];
        const destination = ROUTE_DESTINATIONS[driver.id]?.pos;
        if (!destination) return null;

        return {
          id: driver.id,
          points: generateRoute(from, destination, driver.id * 2.4),
          color: STATUS_STYLE[driver.status].route,
        };
      })
      .filter((route): route is { id: number; points: [number, number][]; color: string } => route !== null);
  }, [drivers, positions, showRoutes]);

  const mapThemeConfig = MAP_THEME_CONFIG[mapTheme] ?? MAP_THEME_CONFIG.light;

  return (
    <MapContainer
      center={[38.5, -96.5]}
      zoom={4}
      className="fleet-map-canvas"
      style={{ height: "100%", width: "100%" }}
      zoomControl
      attributionControl
      doubleClickZoom
    >
      <TileLayer
        attribution={mapThemeConfig.attribution}
        url={mapThemeConfig.url}
        maxZoom={mapThemeConfig.maxZoom}
        subdomains={mapThemeConfig.subdomains}
      />
      <MapSetView />
      <MapFollower driverId={followDriverId} positions={positions} />

      {showRoutes &&
        CORRIDOR_PATHS.map((path, index) => (
          <Polyline
            key={`corridor-${index}`}
            positions={path}
            pathOptions={{
              color: mapTheme === "night" ? "#67e8f9" : "#0ea5e9",
              weight: 1.5,
              opacity: 0.2,
              dashArray: "5 7",
            }}
          />
        ))}

      {showRoutes &&
        networkRoutes.map((route) => (
          <Polyline
            key={`network-route-${route.id}`}
            positions={route.points}
            pathOptions={{
              color: route.color,
              weight: 2,
              opacity: 0.25,
              dashArray: "6 6",
            }}
          />
        ))}

      {selectedRoute && selectedDriver && showRoutes && (
        <Polyline
          positions={selectedRoute}
          pathOptions={{
            color: STATUS_STYLE[selectedDriver.status].route,
            weight: 3.5,
            opacity: 0.8,
            dashArray: selectedDriver.status === "driving" ? undefined : "10 7",
          }}
        />
      )}

      {selectedDriver && ROUTE_DESTINATIONS[selectedDriver.id] && showRoutes && (
        <Marker
          position={ROUTE_DESTINATIONS[selectedDriver.id].pos}
          icon={L.divIcon({
            html: `<div style="
              width:18px;height:18px;border-radius:999px;
              background:white;
              border:3px solid ${STATUS_STYLE[selectedDriver.status].route};
              box-shadow:0 4px 12px rgba(15,23,42,0.35);
            "></div>`,
            className: "",
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          })}
        >
          <Popup className="fleet-popup">
            <div className="fleet-popup__content">
              <strong>Destination</strong>
              <span>{ROUTE_DESTINATIONS[selectedDriver.id].name}</span>
            </div>
          </Popup>
        </Marker>
      )}

      {showGeofences &&
        geofenceCounts.map((geofence) => (
          <Circle
            key={geofence.name}
            center={geofence.center}
            radius={geofence.radius}
            pathOptions={{
              color: mapTheme === "night" ? "#67e8f9" : "#06b6d4",
              fillColor: mapTheme === "night" ? "#0e7490" : "#22d3ee",
              fillOpacity: mapTheme === "night" ? 0.1 : 0.08,
              weight: 1.5,
              dashArray: "7 5",
            }}
          >
            <Popup className="fleet-popup">
              <div className="fleet-popup__content">
                <strong>{geofence.name}</strong>
                <span>
                  {geofence.count} truck{geofence.count === 1 ? "" : "s"} currently inside zone
                </span>
              </div>
            </Popup>
          </Circle>
        ))}

      {showGeofences &&
        geofenceCounts.map((geofence) => (
          <Marker
            key={`badge-${geofence.name}`}
            position={geofence.center}
            icon={createCountBadge(geofence.count)}
            zIndexOffset={-90}
          />
        ))}

      {visibleDrivers.map((driver) => {
        const position = positions[driver.id] ?? DRIVER_POSITIONS[driver.id] ?? [39, -98];
        const isFollowed = followDriverId === driver.id;
        const isSelected = selectedDriverId === driver.id;

        return (
          <Marker
            key={driver.id}
            position={position}
            icon={createTruckIcon(driver, isFollowed, isSelected)}
            zIndexOffset={isFollowed ? 1200 : isSelected ? 900 : 100}
            eventHandlers={{ click: () => onDriverSelect(driver.id) }}
          >
            <Popup className="fleet-popup">
              <div className="fleet-popup__content">
                <strong>
                  {driver.firstName} {driver.lastName}
                </strong>
                <span>
                  {driver.tractorUnit} · {driver.homeTerminal}
                </span>
                <span style={{ color: STATUS_STYLE[driver.status].text }}>
                  {driver.status.replace("_", " ")} · Signal {driver.signalStrength}%
                </span>
                {driver.currentLoad !== "—" && <span>Load {driver.currentLoad}</span>}
                <span>HOS {driver.hosRemaining}h remaining</span>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {showTrafficPulse &&
        drivers
          .filter((driver) => driver.status === "driving")
          .map((driver) => {
            const position = positions[driver.id] ?? DRIVER_POSITIONS[driver.id];
            if (!position) return null;
            return (
              <CircleMarker
                key={`pulse-${driver.id}`}
                center={position}
                radius={12}
                pathOptions={{
                  color: mapTheme === "night" ? "#7dd3fc" : "#3b82f6",
                  fillColor: mapTheme === "night" ? "#38bdf8" : "#60a5fa",
                  fillOpacity: 0.12,
                  opacity: 0.35,
                  weight: 1,
                }}
              />
            );
          })}
    </MapContainer>
  );
}
