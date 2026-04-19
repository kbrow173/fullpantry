import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { SideNav } from "@/components/layout/SideNav";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FullPantry",
    template: "%s | FullPantry",
  },
  description: "Your kitchen companion — recipes, meal planner, pantry tracker, and smart grocery lists.",
  applicationName: "FullPantry",
  appleWebApp: {
    capable: true,
    title: "FullPantry",
    statusBarStyle: "default",
  },
  icons: {
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#C4622D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full`}
    >
      <head>
        {/* Explicit viewport meta to guarantee viewport-fit=cover on iOS PWA (Next 16
            Viewport export has been inconsistent about emitting this). */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body className="min-h-full antialiased">
        <OfflineBanner />
        <SideNav />
        <main
          className="relative min-h-full lg:ml-56"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          {children}
        </main>
        <BottomNav />
        {/* Kill any stale service worker from a previous deploy. The app currently
            has no SW file (sw.js 404s), but older visitors may still have one active
            and serving cached HTML/CSS. Unregister it and purge every cache. */}
        <Script
          id="sw-unregister"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  var hadAny = regs.length > 0;
                  regs.forEach(function(r) { r.unregister(); });
                  if (window.caches) {
                    caches.keys().then(function(keys) {
                      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
                    }).then(function() {
                      if (hadAny) window.location.reload();
                    });
                  } else if (hadAny) {
                    window.location.reload();
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
