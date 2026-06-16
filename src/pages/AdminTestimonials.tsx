import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminTabs } from "@/components/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Star } from "lucide-react";

interface T {
  id: string;
  author_name: string;
  author_role: string | null;
  location: string | null;
  quote: string;
  rating: number | null;
  is_published: boolean;
}

export default function AdminTestimonials() {
  const [items, setItems] = useState<T[]>([]);
  const [form, setForm] = useState({ author_name: "", author_role: "", location: "", quote: "", rating: 5 });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await (supabase as any)
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.author_name.trim() || !form.quote.trim()) {
      toast.error("Name and quote are required");
      return;
    }
    setLoading(true);
    const { error } = await (supabase as any).from("testimonials").insert({
      author_name: form.author_name.trim(),
      author_role: form.author_role.trim() || null,
      location: form.location.trim() || null,
      quote: form.quote.trim(),
      rating: form.rating,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Testimonial added");
    setForm({ author_name: "", author_role: "", location: "", quote: "", rating: 5 });
    load();
  };

  const togglePub = async (t: T) => {
    await (supabase as any).from("testimonials").update({ is_published: !t.is_published }).eq("id", t.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    await (supabase as any).from("testimonials").delete().eq("id", id);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 5rem)" }}>
        <h1 className="text-3xl font-bold mb-2">Testimonials</h1>
        <p className="text-muted-foreground mb-6">Add real reviews from neighbors to feature on the homepage.</p>
        <AdminTabs />

        <Card className="p-6 mb-6 space-y-4">
          <h2 className="text-xl font-bold">Add new</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Author name *</Label>
              <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
            </div>
            <div>
              <Label>Role / context</Label>
              <Input placeholder="Homeowner, Helper, etc." value={form.author_role} onChange={(e) => setForm({ ...form, author_role: e.target.value })} />
            </div>
            <div>
              <Label>Location</Label>
              <Input placeholder="Arlington Heights, IL" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label>Rating</Label>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Quote *</Label>
            <Textarea rows={3} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
          </div>
          <Button onClick={add} disabled={loading}>{loading ? "Adding…" : "Add testimonial"}</Button>
        </Card>

        <div className="space-y-3">
          {items.length === 0 && <p className="text-muted-foreground">No testimonials yet.</p>}
          {items.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {t.rating && (
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  )}
                  <p className="mb-2">"{t.quote}"</p>
                  <p className="text-sm text-muted-foreground">
                    <strong>{t.author_name}</strong>
                    {t.author_role ? ` · ${t.author_role}` : ""}
                    {t.location ? ` · ${t.location}` : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Button size="sm" variant={t.is_published ? "default" : "outline"} onClick={() => togglePub(t)}>
                    {t.is_published ? "Published" : "Hidden"}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(t.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
