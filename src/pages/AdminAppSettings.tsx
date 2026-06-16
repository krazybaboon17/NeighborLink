import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminTabs } from "@/components/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBrand, splitBrandName, BRAND_MAIN, BRAND_ACCENT } from "@/contexts/BrandContext";

export default function AdminAppSettings() {
  const { name, refresh } = useBrand();
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { setValue(name); }, [name]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("check_is_admin");
      setIsAdmin(!!data);
    })();
  }, []);

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 32) {
      toast.error("Name must be 1–32 characters");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any)
      .from("app_settings")
      .update({ app_name: trimmed, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("App name updated");
    await refresh();
  };

  const [main, accent] = splitBrandName(value);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 5rem)" }}>
        <h1 className="text-3xl font-bold mb-2">App Settings</h1>
        <p className="text-muted-foreground mb-6">Rebrand the app — the name updates everywhere instantly.</p>
        <AdminTabs />
        {!isAdmin ? (
          <Card className="p-6"><p>Admin access required.</p></Card>
        ) : (
          <Card className="p-6 space-y-6">
            <div>
              <Label htmlFor="appname">App name</Label>
              <Input
                id="appname"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={32}
                className="mt-2 text-lg"
              />
              <p className="text-xs text-muted-foreground mt-2">
                The name is automatically split — the last syllable gets the brown accent color, the rest stays black.
              </p>
            </div>
            <div>
              <Label>Live preview</Label>
              <div className="mt-2 p-8 rounded-xl border-2 border-dashed border-border bg-card flex items-center justify-center">
                <span className="text-5xl font-bold tracking-tight">
                  <span style={{ color: BRAND_MAIN }}>{main}</span>
                  <span style={{ color: BRAND_ACCENT }}>{accent}</span>
                </span>
              </div>
            </div>
            <Button onClick={save} disabled={saving || value.trim() === name}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
