export enum InvoiceStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SETTLED = "SETTLED",
  OVERDUE = "OVERDUE",
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface InvoiceUserSummary {
  id: string;
  full_name: string;
  email: string;
  wallet_address: string | null;
}

export interface AuditEntry {
  id: string;
  invoice_id: string;
  actor_id: string;
  actor_name: string | null;
  prev_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  title: string;
  line_items: LineItem[];
  total_amount: number;
  status: InvoiceStatus;
  due_date: string | null;
  payment_terms: string | null;
  freelancer_id: string;
  client_id: string;
  freelancer: InvoiceUserSummary;
  client: InvoiceUserSummary;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceRequest {
  title: string;
  line_items: Omit<LineItem, "total">[];
  due_date?: string | null;
  payment_terms?: string | null;
  client_id: string;
}

export interface UpdateInvoiceRequest {
  title?: string;
  line_items?: Omit<LineItem, "total">[];
  due_date?: string | null;
  payment_terms?: string | null;
  client_id?: string;
}

export interface InvoiceListResponse {
  items: Invoice[];
  total: number;
  page: number;
  limit: number;
}
