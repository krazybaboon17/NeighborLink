import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "nl_cookie_consent_v1";

/**
 * First-visit cookie consent banner. Stores acceptance in localStorage so
 * we don't nag returning users.
 */
export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  const dismiss = (value: "accepted" | "dismissed") => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:left-4 sm:bottom-4 sm:max-w-md z-50 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Cookie className="w-4 h-4 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-foreground leading-relaxed">
            We use essential cookies to keep you signed in and remember your
            preferences. See our{" "}
            <Link to="/privacy" className="text-primary underline">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => dismiss("accepted")}
              className="rounded-full min-h-[44px] sm:min-h-0"
            >
              Got it
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => dismiss("dismissed")}
              className="rounded-full min-h-[44px] sm:min-h-0"
            >
              Dismiss
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dismiss("dismissed")}
          aria-label="Close cookie banner"
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
