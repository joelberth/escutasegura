import { motion } from "framer-motion";
import { Clock, Calendar, TrendingUp, Zap } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

type Denuncia = Tables<"denuncias">;

interface AnalyticsPanelProps {
  denuncias: Denuncia[];
}

const AnalyticsPanel = ({ denuncias }: AnalyticsPanelProps) => {
  // Average resolution time
  const resolved = denuncias.filter(d => d.status === "resolvida" && d.resolved_at);
  const avgResolutionHours = resolved.length > 0
    ? resolved.reduce((sum, d) => {
        const diff = new Date(d.resolved_at!).getTime() - new Date(d.created_at).getTime();
        return sum + diff / (1000 * 60 * 60);
      }, 0) / resolved.length
    : 0;
  const avgDays = Math.floor(avgResolutionHours / 24);
  const avgHours = Math.round(avgResolutionHours % 24);

  // Hourly heatmap data
  const hourCounts = Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, "0")}h`, count: 0 }));
  denuncias.forEach(d => {
    const h = new Date(d.created_at).getHours();
    hourCounts[h].count++;
  });
  const maxHourCount = Math.max(...hourCounts.map(h => h.count), 1);

  // Monthly trends
  const monthlyData: Record<string, { total: number; resolvidas: number }> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    monthlyData[key] = { total: 0, resolvidas: 0 };
  }
  denuncias.forEach(d => {
    const key = new Date(d.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    if (monthlyData[key]) monthlyData[key].total++;
    if (d.status === "resolvida" && d.resolved_at) {
      const rKey = new Date(d.resolved_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      if (monthlyData[rKey]) monthlyData[rKey].resolvidas++;
    }
  });
  const monthlyArray = Object.entries(monthlyData).map(([month, v]) => ({ month, ...v }));

  // Day of week distribution
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dayCounts = Array.from({ length: 7 }, (_, i) => ({ day: dayNames[i], count: 0 }));
  denuncias.forEach(d => {
    const dow = new Date(d.created_at).getDay();
    dayCounts[dow].count++;
  });

  // Urgency trend (last 4 weeks)
  const weeklyUrgency: { week: string; alta: number; media: number; baixa: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const start = new Date(Date.now() - (i + 1) * 7 * 86400000);
    const end = new Date(Date.now() - i * 7 * 86400000);
    const label = `Sem ${4 - i}`;
    const week = denuncias.filter(d => {
      const t = new Date(d.created_at);
      return t >= start && t < end;
    });
    weeklyUrgency.push({
      week: label,
      alta: week.filter(d => d.urgencia === "alta").length,
      media: week.filter(d => d.urgencia === "media").length,
      baixa: week.filter(d => d.urgencia === "baixa").length,
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">📈 Analytics Avançado</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Clock, label: "Tempo Médio Resolução", value: resolved.length > 0 ? `${avgDays}d ${avgHours}h` : "N/A", color: "text-primary" },
          { icon: Zap, label: "Denúncias Resolvidas", value: `${resolved.length}`, color: "text-primary" },
          { icon: TrendingUp, label: "Taxa Resolução", value: `${denuncias.length > 0 ? Math.round(resolved.length / denuncias.length * 100) : 0}%`, color: "text-primary" },
          { icon: Calendar, label: "Horário de Pico", value: hourCounts.reduce((a, b) => b.count > a.count ? b : a, hourCounts[0]).hour, color: "text-primary" },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-2xl glass p-5 shadow-card">
            <kpi.icon className={`h-5 w-5 ${kpi.color} mb-2`} />
            <p className="text-2xl font-display font-bold">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Hourly Heatmap */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl glass p-6 shadow-card">
        <h3 className="font-display font-semibold mb-4">🔥 Heatmap de Horários</h3>
        <div className="grid grid-cols-12 gap-1">
          {hourCounts.map((h) => {
            const intensity = h.count / maxHourCount;
            const bg = intensity === 0
              ? "bg-muted"
              : intensity < 0.33
              ? "bg-primary/20"
              : intensity < 0.66
              ? "bg-primary/50"
              : "bg-primary";
            return (
              <div key={h.hour} className="text-center" title={`${h.hour}: ${h.count} denúncias`}>
                <div className={`h-8 rounded ${bg} transition-colors`} />
                <span className="text-[9px] text-muted-foreground">{h.hour}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end text-[10px] text-muted-foreground">
          <span>Menos</span>
          <div className="h-3 w-3 rounded bg-muted" />
          <div className="h-3 w-3 rounded bg-primary/20" />
          <div className="h-3 w-3 rounded bg-primary/50" />
          <div className="h-3 w-3 rounded bg-primary" />
          <span>Mais</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl glass p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">📅 Tendências Mensais</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyArray}>
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 73%, 28%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 73%, 28%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="hsl(142, 73%, 28%)" fill="url(#gTotal)" strokeWidth={2} name="Total" />
              <Area type="monotone" dataKey="resolvidas" stroke="hsl(226, 72%, 40%)" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Resolvidas" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Day of Week */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl glass p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">📊 Denúncias por Dia da Semana</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dayCounts}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(226, 72%, 40%)" radius={[8, 8, 0, 0]} name="Denúncias" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Weekly Urgency Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="rounded-2xl glass p-6 shadow-card">
        <h3 className="font-display font-semibold mb-4">⚡ Urgência por Semana (últimas 4)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyUrgency}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="baixa" stackId="a" fill="hsl(142, 73%, 28%)" name="Baixa" radius={[0, 0, 0, 0]} />
            <Bar dataKey="media" stackId="a" fill="hsl(38, 92%, 50%)" name="Média" />
            <Bar dataKey="alta" stackId="a" fill="hsl(0, 84%, 60%)" name="Alta" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default AnalyticsPanel;
