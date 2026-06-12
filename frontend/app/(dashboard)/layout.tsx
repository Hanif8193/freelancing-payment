"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar, SidebarContent } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import type { User } from "@/types/user";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/invoices": "Invoices",
  "/invoices/new": "New Invoice",
  "/transactions": "Transaction History",
  "/admin": "Admin",
  "/admin/users": "User Management",
  "/admin/transactions": "Transaction Monitor",
  "/profile": "Profile",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setUser(authService.getCurrentUser());
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const title =
    pageTitles[pathname] ??
    pageTitles[Object.keys(pageTitles).find((k) => pathname.startsWith(k + "/")) ?? ""] ??
    "PayAgent";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <Sidebar userRole={user?.role} className="hidden md:flex flex-col" />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile top bar with hamburger */}
        <div className="flex items-center gap-2 border-b px-4 h-14 md:hidden shrink-0">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent userRole={user?.role} onNavClick={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-sm truncate">{title}</span>
        </div>

        <Header title={title} user={user} className="hidden md:flex" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
