import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);

export const MailingListSection = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast({
        title: "Invalid email",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("mailing_list").insert({ email: result.data });
    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already subscribed",
          description: "This email is already on our mailing list!",
        });
        setSubscribed(true);
        setEmail("");
      } else {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    setSubscribed(true);
    setEmail("");
    toast({ title: "Subscribed!", description: "You've been added to our mailing list." });
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg text-center space-y-6"
        >
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            {subscribed ? (
              <CheckCircle className="h-7 w-7 text-primary" />
            ) : (
              <Mail className="h-7 w-7 text-primary" />
            )}
          </div>

          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Stay in the loop
            </h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              {subscribed
                ? "Thanks for subscribing! We'll keep you posted on community news and updates."
                : "Join our mailing list for community updates, new features, and neighborhood news."}
            </p>
          </div>

          {!subscribed ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          ) : (
            <Button variant="outline" onClick={() => setSubscribed(false)}>
              Subscribe another email
            </Button>
          )}
        </motion.div>
      </div>
    </section>
  );
};
