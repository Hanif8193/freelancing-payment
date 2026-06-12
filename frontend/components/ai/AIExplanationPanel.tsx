"use client";

import { useState } from "react";
import { MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { aiService, type AIResponse } from "@/services/aiService";

interface AIExplanationPanelProps {
  invoiceId: string;
}

export function AIExplanationPanel({ invoiceId }: AIExplanationPanelProps) {
  const [result, setResult] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExplain = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiService.explainInvoice(invoiceId);
      setResult(data);
    } catch {
      setError("Failed to generate explanation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
          <MessageSquare className="h-4 w-4" />
          AI Invoice Explanation
        </div>

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}

        {result ? (
          <div className="space-y-1.5">
            <p className="text-sm leading-relaxed text-foreground">{result.text}</p>
            {result.is_fallback && (
              <p className="text-xs text-muted-foreground italic">
                ⚠ AI unavailable — using fallback response
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExplain}
              disabled={isLoading}
              className="text-xs text-muted-foreground h-7"
            >
              Regenerate
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExplain}
            disabled={isLoading}
            className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-400"
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Explaining…
              </>
            ) : (
              <>
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                AI Explain This Invoice
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
