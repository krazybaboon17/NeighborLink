import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);

const Contact = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast({ title: "Invalid email", description: result.error.errors[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("mailing_list").insert({ email: result.data });
    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already subscribed", description: "This email is already on our mailing list!" });
      } else {
        toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
      }
      return;
    }

    setSubscribed(true);
    setEmail("");
    toast({ title: "Subscribed!", description: "You've been added to our mailing list." });
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <SEO
        title="Contact Taskfy — Join the Mailing List"
        description="Get in touch with the Taskfy team and subscribe to updates on new features in Arlington Heights and Buffalo Grove."
        path="/contact"
      />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center space-y-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              {subscribed ? (
                <CheckCircle className="h-7 w-7 text-primary" />
              ) : (
                <Mail className="h-7 w-7 text-primary" />
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground">Contact Us</h1>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {subscribed
                  ? "Thanks for subscribing! We'll keep you in the loop."
                  : "Join our mailing list to get updates, community news, and more."}
              </p>
            </div>

            {!subscribed && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Subscribing..." : "Subscribe"}
                </Button>
              </form>
            )}

            {subscribed && (
              <Button variant="outline" onClick={() => setSubscribed(false)}>
                Subscribe another email
              </Button>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
