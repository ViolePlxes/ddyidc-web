import { Badge } from "../Badge";
import type { TicketStatus } from "../../api/tickets";

function statusVariant(status: TicketStatus): "success" | "warning" | "error" | "neutral" {
  const color = status.color.toLowerCase();
  if (color === "#cc0000") return "error";
  if (color === "#ff6600") return "warning";
  if (color === "#779500") return "success";
  if (status.final) return "neutral";
  return "neutral";
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={statusVariant(status)}>{status.name}</Badge>;
}
