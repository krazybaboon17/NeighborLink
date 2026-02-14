import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { motion } from "framer-motion";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <span className="text-primary-foreground font-bold text-lg">N</span>
              </motion.div>
              <span className="text-xl font-bold">NeighborLink</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Connecting communities through trusted, local task services.
            </p>
            <div className="flex space-x-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <motion.div key={i} whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Icon className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* For Requesters */}
          <div>
            <h3 className="font-semibold mb-4">For Requesters</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Post a Task", "Browse Helpers", "How Pricing Works", "Safety Tips"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-primary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* For Helpers */}
          <div>
            <h3 className="font-semibold mb-4">For Helpers</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Become a Helper", "Helper Guidelines", "Pro Membership", "Payment Info"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-primary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get the latest updates and special offers.
            </p>
            <div className="flex gap-2">
              <Input type="email" placeholder="Your email" className="flex-1" />
              <Button variant="hero" size="sm">Subscribe</Button>
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
