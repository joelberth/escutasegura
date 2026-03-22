import { motion } from "framer-motion";
import { Shield, TrendingUp, CheckCircle2, Clock, AlertTriangle, Zap } from "lucide-react";

interface StatsCardsProps {
  total: number;
  today: number;
  resolvedWeek: number;
  satisfaction: number;
  pending: number;
  highUrgency: number;
}

const StatsCards = ({ total, today, resolvedWeek, satisfaction, pending, highUrgency }: StatsCardsProps) => {
  const cards = [
    {
      label: "Total de Denúncias",
      value: total,
      icon: Shield,
      gradient: "from-primary/20 to-primary/5",
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
      trend: `+${today} hoje`,
    },
    {
      label: "Pendentes",
      value: pending,
      icon: Clock,
      gradient: "from-urgency-medium/20 to-urgency-medium/5",
      iconBg: "bg-urgency-medium/15",
      iconColor: "text-urgency-medium",
      trend: "aguardando ação",
    },
    {
      label: "Resolvidas (7d)",
      value: resolvedWeek,
      icon: CheckCircle2,
      gradient: "from-secondary/20 to-secondary/5",
      iconBg: "bg-secondary/15",
      iconColor: "text-secondary",
      trend: `${satisfaction}% resolução`,
    },
    {
      label: "Urgência Alta",
      value: highUrgency,
      icon: AlertTriangle,
      gradient: "from-destructive/20 to-destructive/5",
      iconBg: "bg-destructive/15",
      iconColor: "text-destructive",
      trend: "requer atenção",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${card.gradient} p-5 shadow-card hover:shadow-elevated transition-all duration-300 group`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`h-10 w-10 rounded-xl ${card.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <Zap className="h-3.5 w-3.5 text-muted-foreground/30" />
          </div>
          <p className="text-3xl font-display font-extrabold tracking-tight">{card.value}</p>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">{card.label}</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="text-xs text-muted-foreground">{card.trend}</span>
          </div>
          {/* Decorative glow */}
          <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
