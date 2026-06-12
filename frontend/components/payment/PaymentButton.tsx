"use client";

import { useState } from "react";
import { DollarSign, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { paymentService } from "@/services/paymentService";
import { formatCurrency, truncateAddress } from "@/lib/utils";
import type { Transaction } from "@/types/payment";

interface PaymentButtonProps {
  invoiceId: string;
  invoiceTitle: string;
  amount: number;
  payeeWallet: string | null;
  onSuccess: (tx: Transaction) => void;
}

export function PaymentButton({
  invoiceId,
  invoiceTitle,
  amount,
  payeeWallet,
  onSuccess,
}: PaymentButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePay = async () => {
    setIsLoading(true);
    try {
      const result = await paymentService.initiatePayment(invoiceId);
      toast.success("Payment confirmed!", {
        description: `Tx: ${result.transaction.tx_hash?.slice(0, 20)}…`,
      });
      setOpen(false);
      onSuccess(result.transaction);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Payment failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full bg-green-600 hover:bg-green-700 text-white">
        <DollarSign className="mr-2 h-4 w-4" />
        Pay Now — {formatCurrency(amount)}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              You are about to send a USDC payment on Arc Testnet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-lg border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-medium truncate max-w-[60%] text-right">{invoiceTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold text-lg">{formatCurrency(amount)}</span>
            </div>
            {payeeWallet && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">To wallet</span>
                <span className="font-mono text-xs flex items-center gap-1">
                  {truncateAddress(payeeWallet)}
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">Arc Testnet (USDC)</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handlePay}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing…
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
