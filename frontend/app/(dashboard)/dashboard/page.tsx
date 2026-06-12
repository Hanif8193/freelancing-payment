"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText, Clock, CheckCircle, DollarSign, Plus,
  AlertTriangle, Bell, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { authService } from "@/services/authService";
import { invoiceService } from "@/services/invoiceService";
import api from "@/services/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { UserRole } from "@/types/user";
import type { User } from "@/types/user";
import type { Invoice } from "@/types/invoice";

interface DashboardMetrics {
  role: string;
  // freelancer
  total_invoices?: number;
  pending_approval?: number;
  overdue?: number;
  total_earned_usdc?: number;
  unread_notifications?: number;
  // client
  invoices_to_approve?: number;
  approved_awaiting_payment?: number;
  total_paid_usdc?: number;
  // admin
  total_users?: number;
  total_transactions?: number;
  total_volume_usdc?: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = authService.getCurrentUser();
    setUser(u);

    Promise.all([
      api.get<DashboardMetrics>("/api/dashboard/metrics").then((r) => r.data),
      invoiceService.listInvoices({ page: 1, limit: 5 }),
    ])
      .then(([m, inv]) => {
        setMetrics(m);
        setRecentInvoices(inv.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isFreelancer = user?.role === UserRole.FREELANCER;
  const isClient = user?.role === UserRole.CLIENT;

  const metricCards = isFreelancer
    ? [
        { label: "Total Invoices", value: metrics?.total_invoices ?? "—", icon: <FileText className="h-5 w-5" />, color: "text-blue-600", desc: "All time" },
        { label: "Pending Approval", value: metrics?.pending_approval ?? "—", icon: <Clock className="h-5 w-5" />, color: "text-yellow-600", desc: "Awaiting client" },
        { label: "USDC Earned", value: metrics ? formatCurrency(metrics.total_earned_usdc ?? 0) : "—", icon: <DollarSign className="h-5 w-5" />, color: "text-green-600", desc: "Settled invoices" },
        { label: "Overdue", value: metrics?.overdue ?? "—", icon: <AlertTriangle className="h-5 w-5" />, color: "text-red-600", desc: "Past due date" },
      ]
    : isClient
    ? [
        { label: "Needs Approval", value: metrics?.invoices_to_approve ?? "—", icon: <Clock className="h-5 w-5" />, color: "text-yellow-600", desc: "Review required" },
        { label: "Awaiting Payment", value: metrics?.approved_awaiting_payment ?? "—", icon: <CheckCircle className="h-5 w-5" />, color: "text-blue-600", desc: "Approved invoices" },
        { label: "USDC Paid", value: metrics ? formatCurrency(metrics.total_paid_usdc ?? 0) : "—", icon: <DollarSign className="h-5 w-5" />, color: "text-green-600", desc: "Total settled" },
        { label: "Total Invoices", value: metrics?.total_invoices ?? "—", icon: <FileText className="h-5 w-5" />, color: "text-slate-600", desc: "Received" },
      ]
    : [
        { label: "Total Users", value: metrics?.total_users ?? "—", icon: <CheckCircle className="h-5 w-5" />, color: "text-blue-600", desc: "Registered" },
        { label: "Total Invoices", value: metrics?.total_invoices ?? "—", icon: <FileText className="h-5 w-5" />, color: "text-slate-600", desc: "Platform-wide" },
        { label: "Total Transactions", value: metrics?.total_transactions ?? "—", icon: <ArrowRight className="h-5 w-5" />, color: "text-violet-600", desc: "Confirmed" },
        { label: "Volume (USDC)", value: metrics ? formatCurrency(metrics.total_volume_usdc ?? 0) : "—", icon: <DollarSign className="h-5 w-5" />, color: "text-green-600", desc: "All time" },
      ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
          </h2>
          <p className="text-muted-foreground text-sm">Here&apos;s what&apos;s happening with your payments.</p>
        </div>
        <div className="flex items-center gap-2">
          {(metrics?.unread_notifications ?? 0) > 0 && (
            <Badge variant="destructive" className="gap-1">
              <Bell className="h-3 w-3" />
              {metrics!.unread_notifications}
            </Badge>
          )}
          {isFreelancer && (
            <Button asChild size="sm">
              <Link href="/invoices/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-16" /><Skeleton className="mt-1 h-3 w-28" /></CardContent>
              </Card>
            ))
          : metricCards.map((m) => (
              <Card key={m.label} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
                  <span className={m.color}>{m.icon}</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{m.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent Invoices</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs">
                <Link href="/invoices">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : recentInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 gap-2 text-sm text-muted-foreground">
                  <p>No invoices yet</p>
                  {isFreelancer && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/invoices/new">Create your first invoice</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <ul className="divide-y">
                  {recentInvoices.map((inv) => (
                    <li key={inv.id}>
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{inv.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {isFreelancer ? inv.client.full_name : inv.freelancer.full_name}
                            {" · "}{formatDate(inv.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 shrink-0">
                          <span className="text-sm font-medium">{formatCurrency(inv.total_amount)}</span>
                          <InvoiceStatusBadge status={inv.status} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isFreelancer && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/invoices/new"><Plus className="mr-2 h-4 w-4" />Create Invoice</Link>
                </Button>
              )}
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/invoices"><FileText className="mr-2 h-4 w-4" />All Invoices</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/transactions"><DollarSign className="mr-2 h-4 w-4" />Transactions</Link>
              </Button>
            </CardContent>
          </Card>

          {/* AI Banner */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="font-semibold text-primary text-sm">AI Agents Active</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Invoice · Reminder · Finance agents ready to assist
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
