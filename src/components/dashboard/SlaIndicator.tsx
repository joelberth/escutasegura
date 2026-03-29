import { Clock, AlertTriangle, Flame } from "lucide-react";

interface SlaIndicatorProps {
  createdAt: string;
  status: string;
  urgencia: string;
  slaDeadline?: string | null;
}

const SlaIndicator = ({ createdAt, status, urgencia, slaDeadline }: SlaIndicatorProps) => {
  if (status === "resolvida") return null;

  const now = new Date();
  let remaining: number;
  let slaDays: number;
  let diffDays: number;

  if (slaDeadline) {
    const deadline = new Date(slaDeadline);
    const diffMs = deadline.getTime() - now.getTime();
    remaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    const created = new Date(createdAt);
    const totalSlaMs = deadline.getTime() - created.getTime();
    slaDays = Math.ceil(totalSlaMs / (1000 * 60 * 60 * 24));
    diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    const created = new Date(createdAt);
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    diffDays = Math.floor(diffHours / 24);

    // SLA thresholds: alta = 3 days, media = 7 days, baixa = 14 days
    const slaMap: Record<string, number> = { alta: 3, media: 7, baixa: 14 };
    slaDays = slaMap[urgencia] || 7;
    remaining = slaDays - diffDays;
  }

  const isOverdue = remaining <= 0;
  const isCritical = remaining <= 1 && remaining > 0;

  // Only show when <50% of time remaining or overdue
  if (remaining > Math.ceil(slaDays * 0.5) && !isOverdue) return null;

  return (
    <div className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
      isOverdue
        ? "bg-destructive/15 text-destructive animate-pulse"
        : isCritical
        ? "bg-urgency-medium/15 text-urgency-medium"
        : "bg-muted text-muted-foreground"
    }`}>
      {isOverdue ? (
        <><Flame className="h-3 w-3" /> Vencido ({Math.abs(remaining)}d atrás)</>
      ) : isCritical ? (
        <><AlertTriangle className="h-3 w-3" /> Vence em breve</>
      ) : (
        <><Clock className="h-3 w-3" /> {remaining}d restantes</>
      )}
    </div>
  );
};

export default SlaIndicator;
