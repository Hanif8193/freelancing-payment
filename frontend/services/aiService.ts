import api from "./api";

export interface AIResponse {
  text: string;
  agent_type: string;
  is_fallback: boolean;
  latency_ms: number;
}

export interface ValidateInvoiceResponse {
  is_complete: boolean;
  missing_fields: string[];
  issues: string[];
  suggestions: string[];
  ai_response: AIResponse;
}

export interface ReminderRunResponse {
  due_reminders_sent: number;
  overdue_followups_sent: number;
}

export const aiService = {
  async summarizeInvoice(invoiceId: string): Promise<AIResponse> {
    const res = await api.post<AIResponse>(`/api/ai/invoices/${invoiceId}/summarize`);
    return res.data;
  },

  async explainInvoice(invoiceId: string): Promise<AIResponse> {
    const res = await api.post<AIResponse>(`/api/ai/invoices/${invoiceId}/explain`);
    return res.data;
  },

  async validateInvoice(invoiceId: string): Promise<ValidateInvoiceResponse> {
    const res = await api.post<ValidateInvoiceResponse>(`/api/ai/invoices/${invoiceId}/validate`);
    return res.data;
  },

  async suggestTerms(invoiceId: string): Promise<AIResponse> {
    const res = await api.post<AIResponse>(`/api/ai/invoices/${invoiceId}/suggest-terms`);
    return res.data;
  },

  async runReminders(): Promise<ReminderRunResponse> {
    const res = await api.post<ReminderRunResponse>("/api/ai/reminders/run");
    return res.data;
  },
};
