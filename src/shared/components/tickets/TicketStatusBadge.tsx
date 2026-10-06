import { Badge } from "../Badge";
import type { TicketStatus } from "../../api/tickets";

function statusVariant(status: TicketStatus): "primary" | "secondary" | "destructive" | "outline" | "beta" {
  const color = status.color.toLowerCase();
  if (color === "#cc0000") return "destructive";
  if (color === "#ff6600") return "beta";
  if (color === "#779500") return "primary";
  if (status.final) return "secondary";
  return "outline";
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={statusVariant(status)}>{status.name}</Badge>;
}
