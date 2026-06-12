"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { paymentService } from "@/services/paymentService";
import { authService } from "@/services/authService";
import { TransactionCard } from "@/components/payment/TransactionCard";
import { TransactionStatus, type Transaction } from "@/types/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_TABS = ["All", "CONFIRMED", "PENDING", "FAILED"] as const;
type TabValue = (typeof STATUS_TABS)[number];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("All");
  const [search, setSearch] = useState("");

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await paymentService.listTransactions({ limit: 100 });
        setTransactions(data);
      } catch {
        toast.error("Failed to load transactions");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = transactions.filter((tx) => {
    const matchesStatus =
      activeTab === "All" || tx.status === (activeTab as TransactionStatus);
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      tx.invoice_id.toLowerCase().includes(q) ||
      tx.payer.full_name.toLowerCase().includes(q) ||
      tx.payee.full_name.toLowerCase().includes(q) ||
      tx.tx_hash?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transaction History</h1>
        <p className="text-sm text-muted-foreground">{transactions.length} total transactions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by invoice ID, name, or tx hash…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />
        <div className="flex gap-2 flex-wrap">
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

      {isLoading ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground text-sm">
          <p>No transactions found</p>
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              currentUserId={currentUser?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
