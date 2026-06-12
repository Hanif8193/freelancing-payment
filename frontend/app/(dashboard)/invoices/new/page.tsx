"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import { invoiceService } from "@/services/invoiceService";
import { Button } from "@/components/ui/button";
import type { CreateInvoiceRequest } from "@/types/invoice";

export default function NewInvoicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (data: CreateInvoiceRequest) => {
    setIsLoading(true);
    try {
      const invoice = await invoiceService.createInvoice(data);
      toast.success("Invoice created successfully");
      router.push(`/invoices/${invoice.id}`);
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New Invoice</h1>
          <p className="text-sm text-muted-foreground">Create a new invoice for your client</p>
        </div>
      </div>

      <InvoiceForm onSubmit={handleCreate} isLoading={isLoading} />
    </div>
  );
}
