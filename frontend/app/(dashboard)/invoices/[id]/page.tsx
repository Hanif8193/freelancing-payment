"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { AuditTrail } from "@/components/invoice/AuditTrail";
import { AISummaryPanel } from "@/components/ai/AISummaryPanel";
import { AIExplanationPanel } from "@/components/ai/AIExplanationPanel";
import { AIReceiptPanel } from "@/components/ai/AIReceiptPanel";
import { AITermsPanel } from "@/components/ai/AITermsPanel";
import { PaymentButton } from "@/components/payment/PaymentButton";
import { invoiceService } from "@/services/invoiceService";
import { paymentService } from "@/services/paymentService";
import { aiService, type ValidateInvoiceResponse } from "@/services/aiService";
import { authService } from "@/services/authService";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceStatus, type AuditEntry, type Invoice } from "@/types/invoice";
import { TransactionStatus, type Transaction } from "@/types/payment";
import { UserRole } from "@/types/user";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [validation, setValidation] = useState<ValidateInvoiceResponse | null>(null);
  const [validating, setValidating] = useState(false);

  const currentUser = authService.getCurrentUser();
  const isFreelancer = currentUser?.role === UserRole.FREELANCER;
  const isClient = currentUser?.role === UserRole.CLIENT;

  useEffect(() => {
    if (!params.id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [inv, audit] = await Promise.all([
          invoiceService.getInvoice(params.id),
          invoiceService.getAuditTrail(params.id),
        ]);
        setInvoice(inv);
        setAuditEntries(audit);

        try {
          const tx = await paymentService.getTransaction(params.id);
          setTransaction(tx);
        } catch {
          // no transaction yet — that's fine
        }
      } catch {
        toast.error("Failed to load invoice");
        router.push("/invoices");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [params.id, router]);

  const refreshAudit = async () => {
    const audit = await invoiceService.getAuditTrail(params.id);
    setAuditEntries(audit);
  };

  const handleAction = async (action: () => Promise<Invoice | void>) => {
    setActionLoading(true);
    try {
      const updated = await action();
      if (updated) setInvoice(updated as Invoice);
      await refreshAudit();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Action failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = () =>
    handleAction(async () => {
      const inv = await invoiceService.submitInvoice(params.id);
      toast.success("Invoice submitted for approval");
      return inv;
    });

  const handleApprove = () =>
    handleAction(async () => {
      const inv = await invoiceService.approveInvoice(params.id);
      toast.success("Invoice approved");
      return inv;
    });

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    handleAction(async () => {
      const inv = await invoiceService.rejectInvoice(params.id, rejectReason);
      toast.success("Invoice rejected");
      setShowRejectInput(false);
      setRejectReason("");
      return inv;
    });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await invoiceService.deleteInvoice(params.id);
      toast.success("Invoice deleted");
      router.push("/invoices");
    } catch {
      toast.error("Failed to delete invoice");
      setActionLoading(false);
    }
  };

  const handlePaymentSuccess = async (tx: Transaction) => {
    setTransaction(tx);
    const freshInvoice = await invoiceService.getInvoice(params.id);
    setInvoice(freshInvoice);
    await refreshAudit();
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const result = await aiService.validateInvoice(params.id);
      setValidation(result);
    } catch {
      toast.error("Validation failed");
    } finally {
      setValidating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Loading invoice…
      </div>
    );
  }

  if (!invoice) return null;

  const canSubmit = isFreelancer && invoice.status === InvoiceStatus.DRAFT;
  const canApproveReject = isClient && invoice.status === InvoiceStatus.PENDING_APPROVAL;
  const canPay = isClient && invoice.status === InvoiceStatus.APPROVED && !transaction;
  const canDelete = isFreelancer && invoice.status === InvoiceStatus.DRAFT;
  const showFreelancerAI = isFreelancer &&
    [InvoiceStatus.DRAFT, InvoiceStatus.PENDING_APPROVAL].includes(invoice.status);
  const showClientAI = isClient &&
    [InvoiceStatus.PENDING_APPROVAL, InvoiceStatus.APPROVED].includes(invoice.status);
  const showReceipt =
    transaction?.status === TransactionStatus.CONFIRMED && transaction?.ai_receipt;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{invoice.title}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(invoice.created_at)}
            </p>
          </div>
        </div>
        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={actionLoading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>

      {/* AI Panels */}
      {showFreelancerAI && <AISummaryPanel invoiceId={params.id} />}
      {isFreelancer && invoice.status === InvoiceStatus.DRAFT && (
        <AITermsPanel invoiceId={params.id} />
      )}
      {showClientAI && <AIExplanationPanel invoiceId={params.id} />}

      {/* AI Receipt (post-payment) */}
      {showReceipt && (
        <AIReceiptPanel
          invoiceId={params.id}
          receiptText={transaction!.ai_receipt!}
        />
      )}

      {/* Validation (freelancer, DRAFT only) */}
      {isFreelancer && invoice.status === InvoiceStatus.DRAFT && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                AI Invoice Validation
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleValidate}
                disabled={validating}
                className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400"
              >
                {validating ? "Checking…" : "Validate Invoice"}
              </Button>
            </div>
            {validation && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {validation.is_complete ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-green-700">Invoice looks complete</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-700">Issues found</span>
                    </>
                  )}
                </div>
                {validation.missing_fields.length > 0 && (
                  <ul className="text-xs space-y-0.5">
                    {validation.missing_fields.map((f) => (
                      <li key={f} className="text-amber-700 dark:text-amber-400">
                        • Missing: {f.replace("_", " ")}
                      </li>
                    ))}
                  </ul>
                )}
                {validation.suggestions.map((s, i) => (
                  <p key={i} className="text-xs text-foreground">• {s}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Parties */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 space-y-1">
            <p className="text-xs text-muted-foreground">Freelancer</p>
            <p className="font-medium">{invoice.freelancer.full_name}</p>
            <p className="text-sm text-muted-foreground">{invoice.freelancer.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-1">
            <p className="text-xs text-muted-foreground">Client</p>
            <p className="font-medium">{invoice.client.full_name}</p>
            <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
          </CardContent>
        </Card>
      </div>

      {(invoice.due_date || invoice.payment_terms) && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          {invoice.due_date && (
            <div>
              <span className="text-muted-foreground">Due Date: </span>
              <span className="font-medium">{formatDate(invoice.due_date)}</span>
            </div>
          )}
          {invoice.payment_terms && (
            <div>
              <span className="text-muted-foreground">Payment Terms: </span>
              <span className="font-medium">{invoice.payment_terms}</span>
            </div>
          )}
        </div>
      )}

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.line_items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator />
          <div className="flex justify-end p-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(invoice.total_amount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {(canSubmit || canApproveReject || canPay) && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            {canSubmit && (
              <Button onClick={handleSubmit} disabled={actionLoading} className="w-full">
                Submit for Approval
              </Button>
            )}
            {canPay && (
              <PaymentButton
                invoiceId={params.id}
                invoiceTitle={invoice.title}
                amount={invoice.total_amount}
                payeeWallet={invoice.freelancer.wallet_address}
                onSuccess={handlePaymentSuccess}
              />
            )}
            {canApproveReject && !showRejectInput && (
              <div className="flex gap-3">
                <Button onClick={handleApprove} disabled={actionLoading} className="flex-1">
                  Approve Invoice
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectInput(true)}
                  disabled={actionLoading}
                  className="flex-1 text-destructive hover:text-destructive"
                >
                  Reject
                </Button>
              </div>
            )}
            {showRejectInput && (
              <div className="space-y-2">
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Reason for rejection…"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    Confirm Rejection
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowRejectInput(false);
                      setRejectReason("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditTrail entries={auditEntries} />
        </CardContent>
      </Card>
    </div>
  );
}
