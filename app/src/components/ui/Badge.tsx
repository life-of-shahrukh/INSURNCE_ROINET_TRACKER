import type { DealStatus } from "@/lib/types";
import { statusBadgeClass, statusLabel } from "@/lib/formatters";

interface BadgeProps {
  status?: DealStatus;
  label?: string;
  className?: string;
}

export function Badge({ status, label, className = "" }: BadgeProps) {
  if (status) {
    return (
      <span className={`badge ${statusBadgeClass(status)} ${className}`.trim()}>
        {statusLabel(status)}
      </span>
    );
  }
  return <span className={`badge ${className}`.trim()}>{label}</span>;
}
