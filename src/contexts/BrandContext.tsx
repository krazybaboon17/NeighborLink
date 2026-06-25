import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

// Brownish accent color
export const BRAND_ACCENT = "#8B5A2B"; // saddle/sienna brown
export const BRAND_MAIN = "#0a0a0a"; // near-black

interface BrandValue {
  name: string;
  mainPart: string;
  accentPart: string;
  refresh: () => Promise<void>;
}

const BrandContext = createContext<BrandValue>({
  name: "Taskify",
  mainPart: "Task",
  accentPart: "fy",
  refresh: async () => {},
});

/** Split a brand name into [main, accent] using a last-syllable heuristic. */
export function splitBrandName(name: string): [string, string] {
  const n = (name || "").trim();
  if (n.length <= 2) return ["", n];
  const vowels = "aeiouyAEIOUY";
  // find last vowel position
  let lastVowel = -1;
  for (let i = n.length - 1; i >= 0; i--) {
    if (vowels.includes(n[i])) { lastVowel = i; break; }
  }
  if (lastVowel === -1) return [n.slice(0, -1), n.slice(-1)];
  // walk back over preceding consonants to include them in accent
  let start = lastVowel;
  while (start > 0 && !vowels.includes(n[start - 1])) start--;
  // ensure main has at least 1 char
  if (start === 0) start = Math.max(1, n.length - 2);
  return [n.slice(0, start), n.slice(start)];
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState("Taskify");

  const fetchName = async () => {
    const { data } = await (supabase as any)
      .from("app_settings")
      .select("app_name")
      .eq("id", 1)
      .maybeSingle();
    if (data?.app_name) setName(data.app_name);
  };

  useEffect(() => {
    fetchName();
    const channel = supabase
      .channel("app-settings-watch")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "app_settings" }, () => fetchName())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const [mainPart, accentPart] = splitBrandName(name);

  // Update <title> base + favicon? Just keep simple — only document title prefix updates.
  useEffect(() => {
    document.title = document.title.replace(/^(Taskify|[^—|]+?)\s*(—|\|)/, `${name} $2`);
  }, [name]);

  return (
    <BrandContext.Provider value={{ name, mainPart, accentPart, refresh: fetchName }}>
      {children}
    </BrandContext.Provider>
  );
}

export const useBrand = () => useContext(BrandContext);
