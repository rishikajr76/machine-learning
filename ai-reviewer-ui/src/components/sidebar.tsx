"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Code2, 
  GitPullRequest, 
  BrainCircuit, 
  BarChart3, 
  Settings,
  Terminal,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Code2, label: "Live Review", href: "/dashboard/review" },
  { icon: GitPullRequest, label: "Pull Requests", href: "/dashboard/pr" },
  { icon: BrainCircuit, label: "Agent Memory", href: "/dashboard/memory" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border/50 bg-card/30 backdrop-blur-xl h-screen sticky top-0 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary neon-purple flex items-center justify-center">
          <Terminal className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-xl tracking-tight gradient-text">Aegis AI</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-primary" : "group-hover:text-foreground"
              )} />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
              )}
              {!isActive && (
                <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Pro Plan</h4>
            <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
              Unlock advanced multi-agent coordination & custom memory.
            </p>
            <button className="w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
