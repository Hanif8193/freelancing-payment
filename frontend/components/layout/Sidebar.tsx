"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, History, Users, Zap, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/user";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["FREELANCER", "CLIENT", "ADMIN"] },
  { href: "/invoices", label: "Invoices", icon: FileText, roles: ["FREELANCER", "CLIENT"] },
  { href: "/transactions", label: "Transactions", icon: History, roles: ["FREELANCER", "CLIENT", "ADMIN"] },
  { href: "/chat", label: "AI Chat", icon: Bot, roles: ["FREELANCER", "CLIENT", "ADMIN"] },
  { href: "/admin", label: "Admin", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/ai-logs", label: "AI Logs", icon: Bot, roles: ["ADMIN"] },
] as const;

interface SidebarProps {
  userRole?: UserRole;
  className?: string;
  onNavClick?: () => void;
}

export function SidebarContent({ userRole, onNavClick }: Pick<SidebarProps, "userRole" | "onNavClick">) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) =>
    userRole ? (item.roles as readonly string[]).includes(userRole) : true
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6 shrink-0">
        <Zap className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">PayAgent</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavClick}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {userRole && (
        <div className="border-t p-4 shrink-0">
          <Badge
            variant={userRole === "FREELANCER" ? "info" : userRole === "CLIENT" ? "success" : "secondary"}
            className="w-full justify-center"
          >
            {userRole}
          </Badge>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ userRole, className }: SidebarProps) {
  return (
    <aside className={cn("w-64 border-r bg-background", className)}>
      <SidebarContent userRole={userRole} />
    </aside>
  );
}
