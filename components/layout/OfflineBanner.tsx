"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    // Sync with current state on mount
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] lg:left-56" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="bg-fp-warning text-white flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold">
        <WifiOff size={13} />
        You&apos;re offline — some features may be unavailable
      </div>
    </div>
  );
}
