"use client";

import { useState } from "react";
import { Plus, Trash2, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { userService } from "@/services/userService";
import type { User } from "@/types/user";
import type { CreateInvoiceRequest } from "@/types/invoice";

interface LineItemRow {
  description: string;
  quantity: string;
  unit_price: string;
}

interface InvoiceFormProps {
  onSubmit: (data: CreateInvoiceRequest) => Promise<void>;
  isLoading?: boolean;
  defaultClientId?: string;
}

const emptyRow = (): LineItemRow => ({ description: "", quantity: "1", unit_price: "" });

export function InvoiceForm({ onSubmit, isLoading, defaultClientId }: InvoiceFormProps) {
  const [title, setTitle] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [resolvedClient, setResolvedClient] = useState<User | null>(null);
  const [clientLookupLoading, setClientLookupLoading] = useState(false);
  const [clientLookupError, setClientLookupError] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [rows, setRows] = useState<LineItemRow[]>([emptyRow()]);
  const [error, setError] = useState<string | null>(null);

  const lookupClient = async () => {
    if (!clientEmail.trim()) return;
    setClientLookupLoading(true);
    setClientLookupError(null);
    setResolvedClient(null);
    setClientId("");
    try {
      const user = await userService.getUserByEmail(clientEmail.trim());
      if (user.role === "FREELANCER") {
        setClientLookupError("That email belongs to a freelancer, not a client");
        return;
      }
      setResolvedClient(user);
      setClientId(user.id);
    } catch {
      setClientLookupError("No user found with that email address");
    } finally {
      setClientLookupLoading(false);
    }
  };

  const clearClient = () => {
    setResolvedClient(null);
    setClientId("");
    setClientEmail("");
    setClientLookupError(null);
  };

  const updateRow = (index: number, field: keyof LineItemRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const computeTotal = () =>
    rows.reduce((sum, r) => {
      const qty = parseFloat(r.quantity) || 0;
      const price = parseFloat(r.unit_price) || 0;
      return sum + qty * price;
    }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Title is required"); return; }
    if (!clientId) { setError("Please look up a client by email first"); return; }

    const line_items = rows.map((r) => ({
      description: r.description,
      quantity: parseFloat(r.quantity) || 0,
      unit_price: parseFloat(r.unit_price) || 0,
    }));

    if (line_items.some((item) => !item.description || item.quantity <= 0 || item.unit_price <= 0)) {
      setError("All line items must have a description, quantity, and price");
      return;
    }

    await onSubmit({
      title,
      client_id: clientId,
      line_items,
      due_date: dueDate || null,
      payment_terms: paymentTerms || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Web Development — March 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Client</Label>
            {resolvedClient ? (
              <div className="flex items-center justify-between rounded-md border border-green-300 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">{resolvedClient.full_name}</p>
                    <p className="text-xs text-muted-foreground">{resolvedClient.email}</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={clearClient} className="h-7 text-xs">
                  Change
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="client@example.com"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => { setClientEmail(e.target.value); setClientLookupError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); lookupClient(); } }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={lookupClient}
                  disabled={clientLookupLoading || !clientEmail.trim()}
                  className="shrink-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            )}
            {clientLookupError && (
              <p className="text-xs text-destructive">{clientLookupError}</p>
            )}
            {!resolvedClient && (
              <p className="text-xs text-muted-foreground">Enter the client&apos;s registered email and click search</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                placeholder="e.g. Net 30"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[1fr_80px_100px_36px] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit Price</span>
            <span />
          </div>

          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_100px_36px] gap-2 items-start">
              <Input
                placeholder="Item description"
                value={row.description}
                onChange={(e) => updateRow(i, "description", e.target.value)}
              />
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="1"
                value={row.quantity}
                onChange={(e) => updateRow(i, "quantity", e.target.value)}
              />
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={row.unit_price}
                onChange={(e) => updateRow(i, "unit_price", e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addRow} className="mt-1">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Line Item
          </Button>

          <Separator className="my-2" />

          <div className="flex justify-end text-sm font-medium">
            Total: {formatCurrency(computeTotal())}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating…" : "Create Invoice"}
      </Button>
    </form>
  );
}
