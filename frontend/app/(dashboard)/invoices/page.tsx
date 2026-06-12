"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { invoiceService } from "@/services/invoiceService";
import { authService } from "@/services/authService";
import { formatCurrency, formatDate, truncateId } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types/invoice";
import { UserRole } from "@/types/user";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | undefined>(undefined);

  const currentUser = authService.getCurrentUser();
  const isFreelancer = currentUser?.role === UserRole.FREELANCER;
  const limit = 20;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await invoiceService.listInvoices({ status: statusFilter, page, limit });
        setInvoices(res.items);
        setTotal(res.total);
      } catch {
        toast.error("Failed to load invoices");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [page, statusFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-muted-foreground">{total} total invoices</p>
        </div>
        {isFreelancer && (
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            <div className="flex flex-wrap gap-2">
              {(["", "DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "SETTLED", "OVERDUE"] as const).map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => { setPage(1); setStatusFilter(s === "" ? undefined : (s as InvoiceStatus)); }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      (s === "" && !statusFilter) || s === statusFilter
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s === "" ? "All" : s.replace("_", " ")}
                  </button>
                )
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Loading…
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground text-sm">
              <p>No invoices found</p>
              {isFreelancer && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/invoices/new">Create your first invoice</Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>{isFreelancer ? "Client" : "Freelancer"}</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/invoices/${inv.id}`} className="hover:underline font-mono text-xs">
                        {truncateId(inv.id)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/invoices/${inv.id}`} className="hover:underline font-medium">
                        {inv.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {isFreelancer ? inv.client.full_name : inv.freelancer.full_name}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(inv.total_amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.due_date ? formatDate(inv.due_date) : "—"}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={inv.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
