const CACHE_NAME = "apollo-tms-v1";
const STATIC_CACHE_NAME = "apollo-tms-static-v1";
const DYNAMIC_CACHE_NAME = "apollo-tms-dynamic-v1";

// Cache different types of assets with different strategies
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/offline",
];

const _CACHE_STRATEGIES = {
  // Cache First - for static assets, fonts, images
  CACHE_FIRST: "cache-first",
  // Network First - for API calls, dynamic content
  NETWORK_FIRST: "network-first",
  // Stale While Revalidate - for frequently updated content
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
};

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Apollo TMS Service Worker: Installing...");

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("Apollo TMS Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("Apollo TMS Service Worker: Static assets cached");
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Apollo TMS Service Worker: Activating...");

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            ) {
              console.log("Apollo TMS Service Worker: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Apollo TMS Service Worker: Activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests unless they're for our API
  if (url.origin !== location.origin && !url.pathname.startsWith("/api/")) return;

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);

  // API calls - Network First strategy
  if (url.pathname.startsWith("/api/")) {
    return networkFirst(request);
  }

  // Static assets (JS, CSS, images) - Cache First strategy
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    return cacheFirst(request);
  }

  // HTML pages - Stale While Revalidate strategy
  if (request.destination === "document") {
    return staleWhileRevalidate(request);
  }

  // Default to Network First for everything else
  return networkFirst(request);
}

// Cache First Strategy - good for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("Apollo TMS Service Worker: Cache First failed:", error);
    return caches.match("/offline") || new Response("Offline", { status: 503 });
  }
}

// Network First Strategy - good for API calls and dynamic content
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("Apollo TMS Service Worker: Network First failed, trying cache:", error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.destination === "document") {
      return caches.match("/offline") || new Response("Offline", { status: 503 });
    }

    // Return generic offline response for API calls
    if (request.url.includes("/api/")) {
      return new Response(JSON.stringify({ error: "Offline", cached: false }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    }

    throw error;
  }
}

// Stale While Revalidate Strategy - good for frequently updated content
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.log("Apollo TMS Service Worker: Stale While Revalidate network failed:", error);
    return cachedResponse || caches.match("/offline");
  });

  return cachedResponse || fetchPromise;
}

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  console.log("Apollo TMS Service Worker: Background sync triggered:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Process any queued offline actions
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const offlineActions = await cache.match("/offline-actions");

    if (offlineActions) {
      const actions = await offlineActions.json();
      console.log("Apollo TMS Service Worker: Processing offline actions:", actions);

      // Process each queued action
      for (const action of actions) {
        try {
          await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body,
          });
          console.log("Apollo TMS Service Worker: Offline action processed:", action);
        } catch (error) {
          console.log("Apollo TMS Service Worker: Failed to process offline action:", error);
        }
      }

      // Clear processed actions
      await cache.delete("/offline-actions");
    }
  } catch (error) {
    console.log("Apollo TMS Service Worker: Background sync failed:", error);
  }
}

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("Apollo TMS Service Worker: Push received");

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.log("Apollo TMS Service Worker: Error parsing push data:", error);
  }

  const options = {
    title: data.title || "Apollo TMS",
    body: data.body || "You have a new notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    image: data.image,
    data: data.data || {},
    actions: data.actions || [
      {
        action: "view",
        title: "View",
        icon: "/icons/view-action.png"
      },
      {
        action: "dismiss",
        title: "Dismiss",
        icon: "/icons/dismiss-action.png"
      }
    ],
    silent: data.silent || false,
    requireInteraction: data.requireInteraction || false,
    timestamp: Date.now(),
    tag: data.tag || "apollo-tms-notification",
    renotify: true,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("Apollo TMS Service Worker: Notification clicked:", event);

  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  if (action === "dismiss") {
    return;
  }

  // Default action or "view" action
  let url = "/";
  if (notificationData.url) {
    url = notificationData.url;
  } else if (notificationData.orderNumber) {
    url = `/orders/${notificationData.orderNumber}`;
  } else if (notificationData.type === "driver-message") {
    url = "/mobile/messages";
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with our app
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }

        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("Apollo TMS Service Worker: Notification closed:", event);

  // Track notification dismissal analytics if needed
  const notificationData = event.notification.data || {};
  if (notificationData.trackDismissal) {
    // Could send analytics data here
  }
});

// Message handling for client-service worker communication
self.addEventListener("message", (event) => {
  console.log("Apollo TMS Service Worker: Message received:", event.data);

  const { type, data } = event.data;

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "GET_CACHE_NAMES":
      event.ports[0].postMessage({
        cacheNames: [CACHE_NAME, STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME]
      });
      break;

    case "CLEAR_CACHE":
      clearCache(data.cacheName)
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;

    case "QUEUE_OFFLINE_ACTION":
      queueOfflineAction(data)
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;

    default:
      console.log("Apollo TMS Service Worker: Unknown message type:", type);
  }
});

async function clearCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
}

async function queueOfflineAction(action) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const existingActions = await cache.match("/offline-actions");

  let actions = [];
  if (existingActions) {
    actions = await existingActions.json();
  }

  actions.push({
    ...action,
    timestamp: Date.now(),
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  });

  const response = new Response(JSON.stringify(actions), {
    headers: { "Content-Type": "application/json" }
  });

  await cache.put("/offline-actions", response);
}

console.log("Apollo TMS Service Worker: Loaded");