import api from "./api";
import type { PaymentInitiateResponse, Transaction } from "@/types/payment";

export const paymentService = {
  async initiatePayment(invoiceId: string): Promise<PaymentInitiateResponse> {
    const res = await api.post<PaymentInitiateResponse>(`/api/payments/${invoiceId}/pay`);
    return res.data;
  },

  async getTransaction(invoiceId: string): Promise<Transaction> {
    const res = await api.get<Transaction>(`/api/payments/${invoiceId}/transaction`);
    return res.data;
  },

  async listTransactions(params?: { page?: number; limit?: number }): Promise<Transaction[]> {
    const res = await api.get<Transaction[]>("/api/payments", { params });
    return res.data;
  },

  getReceiptUrl(invoiceId: string): string {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    return `${base}/api/payments/${invoiceId}/receipt/pdf`;
  },

  async downloadReceipt(invoiceId: string): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const res = await fetch(`${base}/api/payments/${invoiceId}/receipt/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Receipt not available");
    const blob = await res.blob();
    const ext = blob.type === "application/pdf" ? "pdf" : "html";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${invoiceId.slice(0, 8)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
