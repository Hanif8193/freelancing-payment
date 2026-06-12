import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "USDC"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${num.toFixed(2)} ${currency}`;
}

export function formatDate(dateStr: string): string {
  // For date-only strings (YYYY-MM-DD), append T00:00 to avoid UTC midnight shifting the day
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00` : dateStr;
  return new Date(normalized).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function truncateId(id: string, chars = 8): string {
  return id.slice(0, chars).toUpperCase();
}
