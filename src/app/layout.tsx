import type { Metadata } from "next";
import localFont from "next/font/local";
import QueryProvider from "@/lib/providers/query-provider";
import SessionProvider from "@/lib/providers/session-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { HydrationUnblock } from "@/components/hydration-unblock";
import "./globals.css";

const geistSans = localFont({
  variable: "--font-geist-sans",
  display: "swap",
  src: [
    {
      path: "./fonts/geist-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/geist-latin-ext.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
});

const geistMono = localFont({
  variable: "--font-geist-mono",
  display: "swap",
  src: [
    {
      path: "./fonts/geist-mono-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/geist-mono-latin-ext.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Apollo TMS",
  description:
    "Modern web-native Transportation Management System for asset-based trucking companies.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Apollo TMS",
    startupImage: [
      {
        url: "/icons/icon-512x512.png",
        media: "(device-width: 768px) and (device-height: 1024px)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Apollo TMS",
    title: "Apollo TMS - Modern Transportation Management",
    description: "Modern web-native Transportation Management System for asset-based trucking companies.",
    images: [
      {
        url: "/screenshots/desktop-dashboard.png",
        width: 1280,
        height: 720,
        alt: "Apollo TMS Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apollo TMS - Modern Transportation Management",
    description: "Modern web-native Transportation Management System for asset-based trucking companies.",
    images: ["/screenshots/desktop-dashboard.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Apollo TMS",
    "application-name": "Apollo TMS",
    "msapplication-TileColor": "#00B4D8",
    "msapplication-TileImage": "/icons/icon-144x144.png",
    "theme-color": "#00B4D8",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="fm-init">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <HydrationUnblock />
        <PageErrorBoundary>
          <SessionProvider>
            <QueryProvider>
              {children}
              <ServiceWorkerRegistration />
            </QueryProvider>
          </SessionProvider>
        </PageErrorBoundary>
      </body>
    </html>
  );
}
