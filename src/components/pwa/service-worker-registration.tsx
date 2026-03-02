"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface ServiceWorkerFeatureSet {
  registration: ServiceWorkerRegistration | null;
  isOnline: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  showInstallPrompt: () => Promise<"accepted" | "dismissed" | null>;
  updateServiceWorker: () => void;
  queueOfflineAction: (action: unknown) => Promise<unknown> | undefined;
  clearCache: (cacheName?: string) => Promise<unknown> | undefined;
}

interface ApolloTMSWindow extends Window {
  apolloTMS?: {
    serviceWorker?: ServiceWorkerFeatureSet;
  };
}

interface ServiceWorkerRegistrationProps {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
}

export function ServiceWorkerRegistration({
  onUpdate,
  onSuccess,
}: ServiceWorkerRegistrationProps) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if service workers are supported
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      (async () => {
        try {
          const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
          setRegistration(reg);
          reg.addEventListener("updatefound", () => {
            const installingWorker = reg.installing;
            if (installingWorker == null) return;
            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  onUpdate?.(reg);
                } else {
                  onSuccess?.(reg);
                }
              }
            });
          });
        } catch (error) {
          console.error("Apollo TMS Service Worker registration failed:", error);
        }
      })();
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);

    // Check initial online state
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Utility functions for other components to use
  useEffect(() => {
    if (typeof window !== "undefined") {
      const appWindow = window as ApolloTMSWindow;

      // Expose utility functions to window for other components
      appWindow.apolloTMS = {
        ...appWindow.apolloTMS,
        serviceWorker: {
          registration,
          isOnline,
          installPrompt,
          // Function to show install prompt
          showInstallPrompt: async () => {
            if (installPrompt) {
              await installPrompt.prompt();
              const { outcome } = await installPrompt.userChoice;
              setInstallPrompt(null);
              return outcome;
            }
            return null;
          },
          // Function to update service worker
          updateServiceWorker: () => {
            if (registration && registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
              window.location.reload();
            }
          },
          // Function to queue offline action
          queueOfflineAction: async (action: unknown) => {
            if (registration && registration.active) {
              return new Promise((resolve, reject) => {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                  if (event.data.success) {
                    resolve(event.data);
                  } else {
                    reject(new Error(event.data.error));
                  }
                };
                registration.active?.postMessage(
                  {
                    type: "QUEUE_OFFLINE_ACTION",
                    data: action,
                  },
                  [messageChannel.port2]
                );
              });
            }
          },
          // Function to clear cache
          clearCache: async (cacheName?: string) => {
            if (registration && registration.active) {
              return new Promise((resolve, reject) => {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                  if (event.data.success) {
                    resolve(event.data);
                  } else {
                    reject(new Error(event.data.error));
                  }
                };
                registration.active?.postMessage(
                  {
                    type: "CLEAR_CACHE",
                    data: { cacheName },
                  },
                  [messageChannel.port2]
                );
              });
            }
          },
        },
      };
    }
  }, [registration, isOnline, installPrompt]);

  // This component doesn't render anything visible
  return null;
}

// Hook for components to use service worker features
export function useServiceWorker() {
  const [swFeatures, setSwFeatures] = useState<ServiceWorkerFeatureSet | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const appWindow = window as ApolloTMSWindow;
      const features = appWindow.apolloTMS?.serviceWorker;
      setSwFeatures((prev) => {
        const next = features || null;
        return prev === next ? prev : next;
      });

      // Poll for features if not ready yet
      if (!features) {
        const interval = setInterval(() => {
          const updatedFeatures = appWindow.apolloTMS?.serviceWorker;
          if (updatedFeatures) {
            setSwFeatures(updatedFeatures);
            clearInterval(interval);
          }
        }, 100);

        return () => clearInterval(interval);
      }
    }
  }, []);

  return swFeatures;
}
