"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { aiService, type AIResponse } from "@/services/aiService";

interface AISummaryPanelProps {
  invoiceId: string;
}

export function AISummaryPanel({ invoiceId }: AISummaryPanelProps) {
  const [result, setResult] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiService.summarizeInvoice(invoiceId);
      setResult(data);
      setIsExpanded(true);
    } catch {
      setError("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/20">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-400">
            <Sparkles className="h-4 w-4" />
            AI Invoice Summary
          </div>
          {result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded((e) => !e)}
              className="h-7 text-xs text-muted-foreground"
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}

        {result && isExpanded && (
          <div className="space-y-1.5">
            <p className="text-sm leading-relaxed text-foreground">{result.text}</p>
            {result.is_fallback && (
              <p className="text-xs text-muted-foreground italic">
                ⚠ AI unavailable — using fallback response
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Generated in {result.latency_ms}ms
            </p>
          </div>
        )}

        {!result && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isLoading}
            className="border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-400"
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate AI Summary
              </>
            )}
          </Button>
        )}

        {result && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerate}
            disabled={isLoading}
            className="text-xs text-muted-foreground h-7"
          >
            Regenerate
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
