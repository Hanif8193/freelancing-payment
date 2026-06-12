import api from "./api";
import type {
  AuditEntry,
  CreateInvoiceRequest,
  Invoice,
  InvoiceListResponse,
  InvoiceStatus,
  UpdateInvoiceRequest,
} from "@/types/invoice";

export const invoiceService = {
  async listInvoices(params?: {
    status?: InvoiceStatus;
    page?: number;
    limit?: number;
  }): Promise<InvoiceListResponse> {
    const res = await api.get<InvoiceListResponse>("/api/invoices", { params });
    return res.data;
  },

  async createInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
    const res = await api.post<Invoice>("/api/invoices", data);
    return res.data;
  },

  async getInvoice(id: string): Promise<Invoice> {
    const res = await api.get<Invoice>(`/api/invoices/${id}`);
    return res.data;
  },

  async updateInvoice(id: string, data: UpdateInvoiceRequest): Promise<Invoice> {
    const res = await api.patch<Invoice>(`/api/invoices/${id}`, data);
    return res.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    await api.delete(`/api/invoices/${id}`);
  },

  async submitInvoice(id: string): Promise<Invoice> {
    const res = await api.post<Invoice>(`/api/invoices/${id}/submit`);
    return res.data;
  },

  async approveInvoice(id: string): Promise<Invoice> {
    const res = await api.post<Invoice>(`/api/invoices/${id}/approve`);
    return res.data;
  },

  async rejectInvoice(id: string, reason: string): Promise<Invoice> {
    const res = await api.post<Invoice>(`/api/invoices/${id}/reject`, { reason });
    return res.data;
  },

  async getAuditTrail(id: string): Promise<AuditEntry[]> {
    const res = await api.get<AuditEntry[]>(`/api/invoices/${id}/audit`);
    return res.data;
  },
};
