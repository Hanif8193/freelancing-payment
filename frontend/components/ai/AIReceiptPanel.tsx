"use client";

import { useState } from "react";
import { Receipt, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AIResponse } from "@/services/aiService";

interface AIReceiptPanelProps {
  receiptText?: string;
  invoiceId: string;
  isLoading?: boolean;
  aiResult?: AIResponse | null;
}

export function AIReceiptPanel({ receiptText, invoiceId, isLoading, aiResult }: AIReceiptPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDownload = () => {
    const text = receiptText ?? aiResult?.text ?? "";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${invoiceId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const content = receiptText ?? aiResult?.text;

  if (isLoading) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
            Generating AI receipt…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!content) return null;

  return (
    <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            AI Payment Receipt
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded((e) => !e)}
              className="text-xs h-7"
            >
              {isExpanded ? "Hide" : "View Receipt"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-400"
            >
              <Download className="mr-1 h-3 w-3" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-2">
          <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-foreground bg-white/70 dark:bg-black/20 rounded p-3 border">
            {content}
          </pre>
          {aiResult?.is_fallback && (
            <p className="text-xs text-muted-foreground italic flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              AI unavailable — receipt generated with fallback
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
