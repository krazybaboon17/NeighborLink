import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cookie, X, ShieldCheck, Moon, Sparkles, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTheme } from "@/hooks/useTheme";

const CONSENT_KEY = "nl_cookie_consent_v2";

/**
 * First-visit cookie / preferences panel.
 *
 * Unlike a "decorative" GDPR banner, these toggles bind to real local
 * preferences that the rest of the app already reads:
 *  - settings.reduceMotion → disables heavy animations everywhere
 *  - tasks.verifiedOnly    → default-filters the Browse Tasks page
 *  - taskfy.theme          → light / dark / system
 *
 * Accepting just dismisses the banner; the user can also open the
 * Customize panel to tune those prefs without leaving the home page.
 */
export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  // Bind to the same keys Settings reads — so a change here is the same
  // change the user would make from /settings.
  const [reduceMotion, setReduceMotion] = useLocalStorage("settings.reduceMotion", false);
  const [verifiedOnly, setVerifiedOnly] = useLocalStorage("tasks.verifiedOnly", false);
  const { mode, setMode } = useTheme();

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(CONSENT_KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  // Keep the documentElement class in sync so "reduce motion" takes
  // effect immediately, even if the user toggles it from this panel
  // before visiting Settings.
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
  }, [reduceMotion]);

  const persistConsent = (value: "accepted" | "customized" | "dismissed") => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show && !customizeOpen) return null;

  return (
    <>
      {show && (
        <div
          role="region"
          aria-label="Cookie and preferences"
          className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:left-4 sm:bottom-4 sm:max-w-md z-50 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Cookie className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm text-foreground leading-relaxed">
                Taskify uses <strong>essential cookies</strong> to keep you signed in,
                plus a few <strong>local preferences</strong> (theme, motion, default
                filters). No ads, no cross-site tracking. Read more in our{" "}
                <Link to="/privacy" className="text-primary underline">
                  Privacy Policy
                </Link>
                .
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => persistConsent("accepted")}
                  className="rounded-full min-h-[44px] sm:min-h-0"
                >
                  Accept &amp; continue
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCustomizeOpen(true)}
                  className="rounded-full min-h-[44px] sm:min-h-0"
                >
                  Customize
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => persistConsent("dismissed")}
              aria-label="Close cookie banner"
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" aria-hidden="true" />
              Your preferences
            </DialogTitle>
            <DialogDescription>
              These toggles change real settings in Taskify — you'll see the
              effect right away. You can revisit them anytime in{" "}
              <Link to="/settings" className="text-primary underline">
                Settings
              </Link>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <PrefRow
              icon={<ShieldCheck className="w-4 h-4 text-primary" />}
              title="Essential cookies"
              desc="Required to keep you signed in and remember this choice. Always on."
            >
              <Switch checked disabled aria-label="Essential cookies always on" />
            </PrefRow>

            <PrefRow
              icon={<Sparkles className="w-4 h-4 text-primary" />}
              title="Reduce motion"
              desc="Disables decorative animations across the app. Great for low-power devices or motion sensitivity."
            >
              <Switch
                checked={reduceMotion}
                onCheckedChange={(v) => setReduceMotion(!!v)}
                aria-label="Toggle reduce motion"
              />
            </PrefRow>

            <PrefRow
              icon={<BadgeCheck className="w-4 h-4 text-primary" />}
              title="Show verified helpers only"
              desc="Browse Tasks will default to verified neighbors. Change it anytime with the filter."
            >
              <Switch
                checked={verifiedOnly}
                onCheckedChange={(v) => setVerifiedOnly(!!v)}
                aria-label="Toggle verified-only default"
              />
            </PrefRow>

            <PrefRow
              icon={<Moon className="w-4 h-4 text-primary" />}
              title="Appearance"
              desc="Match your device, or pick a fixed light or dark theme."
            >
              <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                {(["light", "system", "dark"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`px-2.5 py-1 text-xs rounded-md capitalize transition-colors ${
                      mode === m
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </PrefRow>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setCustomizeOpen(false);
                persistConsent("dismissed");
              }}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setCustomizeOpen(false);
                persistConsent("customized");
              }}
            >
              Save preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PrefRow({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium text-sm text-foreground">{title}</p>
          <div className="shrink-0">{children}</div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
