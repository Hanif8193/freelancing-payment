import { Badge } from "@/components/ui/badge";
import { InvoiceStatus } from "@/types/invoice";

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "orange" }
> = {
  [InvoiceStatus.DRAFT]: { label: "Draft", variant: "secondary" },
  [InvoiceStatus.PENDING_APPROVAL]: { label: "Pending Approval", variant: "warning" },
  [InvoiceStatus.APPROVED]: { label: "Approved", variant: "success" },
  [InvoiceStatus.REJECTED]: { label: "Rejected", variant: "destructive" },
  [InvoiceStatus.SETTLED]: { label: "Settled", variant: "info" },
  [InvoiceStatus.OVERDUE]: { label: "Overdue", variant: "orange" },
};

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
