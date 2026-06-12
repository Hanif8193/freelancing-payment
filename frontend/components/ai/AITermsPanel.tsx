"use client";

import { useState } from "react";
import { Lightbulb, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { aiService, type AIResponse } from "@/services/aiService";

interface AITermsPanelProps {
  invoiceId: string;
}

export function AITermsPanel({ invoiceId }: AITermsPanelProps) {
  const [result, setResult] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiService.suggestTerms(invoiceId);
      setResult(data);
    } catch {
      setError("Failed to generate suggestion. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
          <Lightbulb className="h-4 w-4" />
          AI Payment Terms Advisor
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
            <p className="text-xs text-muted-foreground">Generated in {result.latency_ms}ms</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSuggest}
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
            onClick={handleSuggest}
            disabled={isLoading}
            className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400"
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                Thinking…
              </>
            ) : (
              <>
                <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
                Suggest Payment Terms
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
