"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DRIVER_STATUS = ["available", "on_load", "driving", "off_duty"] as const;
const LOAD_STATUS = ["assigned", "dispatched", "in_transit", "delivered"] as const;
const ASSIGNMENT_ACTION = ["created", "updated", "deleted"] as const;
type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface DriverUpdate {
  type: "driver_update";
  driverId: number;
  status?: (typeof DRIVER_STATUS)[number];
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface LoadUpdate {
  type: "load_update";
  orderId: number;
  status?: (typeof LOAD_STATUS)[number];
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface AssignmentUpdate {
  type: "assignment_update";
  assignmentId: number;
  action: (typeof ASSIGNMENT_ACTION)[number];
  driverId: number;
  orderId: number;
}

type DispatchUpdate = DriverUpdate | LoadUpdate | AssignmentUpdate;

interface UseDispatchWebSocketOptions {
  enabled?: boolean;
  onDriverUpdate?: (update: DriverUpdate) => void;
  onLoadUpdate?: (update: LoadUpdate) => void;
  onAssignmentUpdate?: (update: AssignmentUpdate) => void;
}

const randomFrom = <T,>(values: readonly T[]): T =>
  values[Math.floor(Math.random() * values.length)] ?? values[0];

export function useDispatchWebSocket({
  enabled = true,
  onDriverUpdate,
  onLoadUpdate,
  onAssignmentUpdate,
}: UseDispatchWebSocketOptions = {}) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const callbacksRef = useRef({
    onDriverUpdate,
    onLoadUpdate,
    onAssignmentUpdate,
  });

  useEffect(() => {
    callbacksRef.current = {
      onDriverUpdate,
      onLoadUpdate,
      onAssignmentUpdate,
    };
  }, [onDriverUpdate, onLoadUpdate, onAssignmentUpdate]);

  const clearTimers = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (firstUpdateTimeoutRef.current) {
      clearTimeout(firstUpdateTimeoutRef.current);
      firstUpdateTimeoutRef.current = null;
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  const dispatchUpdate = useCallback((update: DispatchUpdate) => {
    setLastUpdate(new Date());
    switch (update.type) {
      case "driver_update":
        callbacksRef.current.onDriverUpdate?.(update);
        break;
      case "load_update":
        callbacksRef.current.onLoadUpdate?.(update);
        break;
      case "assignment_update":
        callbacksRef.current.onAssignmentUpdate?.(update);
        break;
    }
  }, []);

  const emitMockUpdate = useCallback(() => {
    const updateType = randomFrom(["driver", "load", "assignment"] as const);

    if (updateType === "driver") {
      dispatchUpdate({
        type: "driver_update",
        driverId: Math.floor(Math.random() * 20) + 1,
        status: randomFrom(DRIVER_STATUS),
        location: {
          latitude: 32.7767 + (Math.random() - 0.5) * 2,
          longitude: -96.797 + (Math.random() - 0.5) * 2,
        },
      });
      return;
    }

    if (updateType === "load") {
      dispatchUpdate({
        type: "load_update",
        orderId: Math.floor(Math.random() * 50) + 1,
        status: randomFrom(LOAD_STATUS),
      });
      return;
    }

    dispatchUpdate({
      type: "assignment_update",
      assignmentId: Math.floor(Math.random() * 100) + 1,
      action: randomFrom(ASSIGNMENT_ACTION),
      driverId: Math.floor(Math.random() * 20) + 1,
      orderId: Math.floor(Math.random() * 50) + 1,
    });
  }, [dispatchUpdate]);

  const disconnect = useCallback(() => {
    clearTimers();
    setConnectionStatus("disconnected");
  }, [clearTimers]);

  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }

    clearTimers();
    setConnectionStatus("connecting");

    connectionTimeoutRef.current = setTimeout(() => {
      setConnectionStatus("connected");

      updateIntervalRef.current = setInterval(() => {
        emitMockUpdate();
      }, 30_000);

      // Emit first update shortly after connection for immediate UI freshness.
      firstUpdateTimeoutRef.current = setTimeout(() => emitMockUpdate(), 5_000);
    }, 1_000);
  }, [clearTimers, emitMockUpdate, enabled]);

  useEffect(() => {
    const lifecycleTimeout = window.setTimeout(() => {
      if (enabled) {
        connect();
      } else {
        disconnect();
      }
    }, 0);

    return () => {
      window.clearTimeout(lifecycleTimeout);
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  return {
    connectionStatus,
    lastUpdate,
    isConnected: connectionStatus === "connected",
    connect,
    disconnect,
  };
}
