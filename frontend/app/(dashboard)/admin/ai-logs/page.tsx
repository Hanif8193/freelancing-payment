"use client";

import { useEffect, useState } from "react";
import { Bot, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";
import { formatDate } from "@/lib/utils";

interface AILogEntry {
  id: string;
  agent_type: string;
  invoice_id: string | null;
  actor_id: string | null;
  prompt_summary: string | null;
  response_text: string | null;
  is_fallback: boolean;
  latency_ms: number | null;
  created_at: string;
}

const agentColor: Record<string, string> = {
  INVOICE_AGENT: "bg-violet-100 text-violet-700",
  FINANCE_AGENT: "bg-green-100 text-green-700",
  REMINDER_AGENT: "bg-blue-100 text-blue-700",
};

export default function AILogsPage() {
  const [logs, setLogs] = useState<AILogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get<AILogEntry[]>("/api/ai/logs?limit=100")
      .then((r) => setLogs(r.data))
      .catch(() => toast.error("Failed to load AI logs"))
      .finally(() => setIsLoading(false));
  }, []);

  const fallbackCount = logs.filter((l) => l.is_fallback).length;
  const avgLatency = logs.length
    ? Math.round(logs.filter((l) => l.latency_ms).reduce((s, l) => s + (l.latency_ms ?? 0), 0) / logs.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Agent Logs</h1>
        <p className="text-sm text-muted-foreground">All Claude API calls from the agent system</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{logs.length}</p>
            <p className="text-sm text-muted-foreground">Total calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{logs.length - fallbackCount}</p>
            <p className="text-sm text-muted-foreground">Live AI responses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{avgLatency}ms</p>
            <p className="text-sm text-muted-foreground">Avg latency</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Recent Agent Calls
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Loading…
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No AI calls yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${agentColor[log.agent_type] ?? "bg-muted text-muted-foreground"}`}>
                        {log.agent_type.replace("_AGENT", "")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.is_fallback ? (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="h-3 w-3" /> Fallback
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" /> Live
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.latency_ms != null ? `${log.latency_ms}ms` : "—"}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-xs text-muted-foreground truncate" title={log.prompt_summary ?? ""}>
                        {log.prompt_summary?.slice(0, 80) ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
