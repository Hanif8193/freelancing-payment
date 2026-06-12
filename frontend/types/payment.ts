export enum TransactionStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  FAILED = "FAILED",
}

export interface TransactionUser {
  id: string;
  full_name: string;
  email: string;
  wallet_address: string | null;
}

export interface Transaction {
  id: string;
  invoice_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  circle_transfer_id: string | null;
  tx_hash: string | null;
  payer_wallet: string | null;
  payee_wallet: string | null;
  ai_receipt: string | null;
  error_message: string | null;
  created_at: string;
  confirmed_at: string | null;
  payer: TransactionUser;
  payee: TransactionUser;
}

export interface PaymentInitiateResponse {
  transaction: Transaction;
  message: string;
}
