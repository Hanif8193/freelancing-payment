"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, FileText, DollarSign, ArrowRight, Bot } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/services/api";
import { aiService } from "@/services/aiService";
import { formatCurrency } from "@/lib/utils";

interface AdminMetrics {
  total_users: number;
  total_invoices: number;
  total_transactions: number;
  total_volume_usdc: number;
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningReminders, setRunningReminders] = useState(false);

  useEffect(() => {
    api
      .get<AdminMetrics>("/api/dashboard/metrics")
      .then((r) => setMetrics(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Users", value: metrics?.total_users ?? "—", icon: <Users className="h-5 w-5" />, color: "text-blue-600" },
    { label: "Total Invoices", value: metrics?.total_invoices ?? "—", icon: <FileText className="h-5 w-5" />, color: "text-slate-600" },
    { label: "Transactions", value: metrics?.total_transactions ?? "—", icon: <ArrowRight className="h-5 w-5" />, color: "text-violet-600" },
    { label: "Volume (USDC)", value: metrics ? formatCurrency(metrics.total_volume_usdc) : "—", icon: <DollarSign className="h-5 w-5" />, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform-wide overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-16" /></CardContent>
              </Card>
            ))
          : cards.map((c) => (
              <Card key={c.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                  <span className={c.color}>{c.icon}</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{c.value}</div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-semibold">User Management</p>
                <p className="text-sm text-muted-foreground">Activate / deactivate accounts</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/users">Manage <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-semibold">Transaction Monitor</p>
                <p className="text-sm text-muted-foreground">View all platform transactions</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/transactions">Monitor <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-violet-500" />
              <div>
                <p className="font-semibold">AI Agent Logs</p>
                <p className="text-sm text-muted-foreground">All Claude API calls and latencies</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/ai-logs">View <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-amber-500" />
              <div>
                <p className="font-semibold">AI Reminder Agent</p>
                <p className="text-sm text-muted-foreground">Send due-date payment reminders</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={runningReminders}
              onClick={async () => {
                setRunningReminders(true);
                try {
                  const r = await aiService.runReminders();
                  toast.success(`Sent ${r.due_reminders_sent + r.overdue_followups_sent} reminder(s)`);
                } catch {
                  toast.error("Failed to run reminders");
                } finally {
                  setRunningReminders(false);
                }
              }}
            >
              {runningReminders ? "Running…" : "Run Now"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
