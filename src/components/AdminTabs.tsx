import { NavLink } from "react-router-dom";
import { Shield, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin/tasks", label: "Tasks moderation", icon: ShieldCheck },
  { to: "/admin/verifications", label: "Verifications", icon: Shield },
];

export function AdminTabs() {
  return (
    <div className="flex items-center gap-2 mb-6 border-b border-border overflow-x-auto">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            cn(
              "inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )
          }
        >
          <Icon className="w-4 h-4" /> {label}
        </NavLink>
      ))}
    </div>
  );
}
