import { formatDate } from "@/lib/utils";
import type { AuditEntry } from "@/types/invoice";

interface AuditTrailProps {
  entries: AuditEntry[];
}

export function AuditTrail({ entries }: AuditTrailProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No audit history yet.</p>;
  }

  return (
    <ol className="relative border-l border-border ml-3">
      {entries.map((entry, i) => (
        <li key={entry.id} className="mb-6 ml-6">
          <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold ring-4 ring-background">
            {entries.length - i}
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium leading-none">
              {entry.prev_status ? (
                <>
                  <span className="text-muted-foreground">{entry.prev_status}</span>
                  {" → "}
                  <span className="text-foreground">{entry.new_status}</span>
                </>
              ) : (
                <span>Created as {entry.new_status}</span>
              )}
            </p>
            {entry.note && (
              <p className="text-sm text-muted-foreground">{entry.note}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {entry.actor_name ?? "System"} &middot; {formatDate(entry.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
