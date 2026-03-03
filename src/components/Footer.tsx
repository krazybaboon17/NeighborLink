import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <Logo size="sm" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered community marketplace connecting neighbors for trusted, local task services.
            </p>
            <div className="flex space-x-2">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <motion.div key={i} whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                    <Icon className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* For Requesters */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground">For Requesters</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { label: "Post a Task", href: "/post-task" },
                { label: "Browse Helpers", href: "/tasks" },
                { label: "How Pricing Works", href: "/features" },
                { label: "Safety Tips", href: "/features" }
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="hover:text-primary transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Helpers */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground">For Helpers</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { label: "Become a Helper", href: "/auth" },
                { label: "Browse Tasks", href: "/tasks" },
                { label: "Service Hours", href: "/service-hours" },
                { label: "Get Verified", href: "/verify" }
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="hover:text-primary transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Get the latest updates and community news.
            </p>
            <div className="flex gap-2">
              <Input type="email" placeholder="Your email" className="flex-1" />
              <Button variant="default" size="sm">Subscribe</Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 NeighborLink. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            {["Privacy Policy", "Terms of Service", "Contact Us"].map((item) => (
              <a key={item} href="#" className="hover:text-primary transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
