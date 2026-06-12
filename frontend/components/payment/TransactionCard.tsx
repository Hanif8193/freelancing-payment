"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, truncateAddress } from "@/lib/utils";
import { TransactionStatus, type Transaction } from "@/types/payment";
import { paymentService } from "@/services/paymentService";

const STATUS_VARIANT: Record<
  TransactionStatus,
  "success" | "warning" | "destructive"
> = {
  [TransactionStatus.CONFIRMED]: "success",
  [TransactionStatus.PENDING]: "warning",
  [TransactionStatus.FAILED]: "destructive",
};

interface TransactionCardProps {
  transaction: Transaction;
  currentUserId?: string;
}

export function TransactionCard({ transaction: tx, currentUserId }: TransactionCardProps) {
  const [copied, setCopied] = useState(false);

  const copyHash = async () => {
    if (!tx.tx_hash) return;
    await navigator.clipboard.writeText(tx.tx_hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSender = tx.payer_id === currentUserId;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${isSender ? "text-red-600" : "text-green-600"}`}>
              {isSender ? "−" : "+"}{formatCurrency(tx.amount)}
            </span>
            <Badge variant={STATUS_VARIANT[tx.status]}>{tx.status}</Badge>
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            <p className="font-medium">{tx.payer.full_name}</p>
            {tx.payer_wallet && (
              <p className="font-mono text-xs text-muted-foreground">
                {truncateAddress(tx.payer_wallet)}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">To</p>
            <p className="font-medium">{tx.payee.full_name}</p>
            {tx.payee_wallet && (
              <p className="font-mono text-xs text-muted-foreground">
                {truncateAddress(tx.payee_wallet)}
              </p>
            )}
          </div>
        </div>

        {tx.tx_hash && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Transaction Hash</p>
                <p className="font-mono text-xs truncate">{truncateAddress(tx.tx_hash, 12)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={copyHash}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </>
        )}

        {tx.status === TransactionStatus.CONFIRMED && (
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 flex-1"
              onClick={() => paymentService.downloadReceipt(tx.invoice_id).catch(() => {})}
            >
              <Download className="mr-1.5 h-3 w-3" />
              Download Receipt
            </Button>
          </div>
        )}

        {tx.error_message && (
          <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
            Error: {tx.error_message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
