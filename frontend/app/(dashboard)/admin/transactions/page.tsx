"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionCard } from "@/components/payment/TransactionCard";
import api from "@/services/api";
import { TransactionStatus, type Transaction } from "@/types/payment";

const STATUS_TABS = ["All", "CONFIRMED", "PENDING", "FAILED"] as const;

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]>("All");

  useEffect(() => {
    api
      .get<Transaction[]>("/api/admin/transactions?limit=200")
      .then((r) => setTransactions(r.data))
      .catch(() => toast.error("Failed to load transactions"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = transactions.filter((tx) => {
    const matchStatus = activeTab === "All" || tx.status === (activeTab as TransactionStatus);
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      tx.tx_hash?.toLowerCase().includes(q) ||
      tx.invoice_id.toLowerCase().includes(q) ||
      tx.payer.full_name.toLowerCase().includes(q) ||
      tx.payee.full_name.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Transaction Monitor</h1>
          <p className="text-sm text-muted-foreground">{transactions.length} total platform transactions</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by tx hash, invoice ID, or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          No transactions found
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((tx) => (
            <TransactionCard key={tx.id} transaction={tx} />
          ))}
        </div>
      )}
    </div>
  );
}
