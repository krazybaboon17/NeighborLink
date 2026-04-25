import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Fixed banner that appears whenever the browser reports going offline.
 * Disappears automatically when connection is restored.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[100] bg-destructive text-destructive-foreground text-sm font-medium px-4 py-2 flex items-center justify-center gap-2"
    >
      <WifiOff className="w-4 h-4" aria-hidden="true" />
      You're offline. Some features won't work until you reconnect.
    </div>
  );
}
