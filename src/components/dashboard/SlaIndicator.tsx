import { Clock, AlertTriangle, Flame } from "lucide-react";

interface SlaIndicatorProps {
  createdAt: string;
  status: string;
  urgencia: string;
}

const SlaIndicator = ({ createdAt, status, urgencia }: SlaIndicatorProps) => {
  if (status === "resolvida") return null;

  const now = new Date();
  const created = new Date(createdAt);
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  const diffDays = Math.floor(diffHours / 24);

  // SLA thresholds: alta = 3 days, media = 7 days, baixa = 14 days
  const slaMap: Record<string, number> = { alta: 3, media: 7, baixa: 14 };
  const slaDays = slaMap[urgencia] || 7;
  const remaining = slaDays - diffDays;
  const percentUsed = Math.min((diffDays / slaDays) * 100, 100);

  if (remaining > Math.ceil(slaDays * 0.5)) return null; // Only show when >50% of SLA used

  const isOverdue = remaining <= 0;
  const isCritical = remaining <= 1 && remaining > 0;

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
        <><AlertTriangle className="h-3 w-3" /> Vence amanhã</>
      ) : (
        <><Clock className="h-3 w-3" /> {remaining}d restantes</>
      )}
    </div>
  );
};

export default SlaIndicator;
