import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, TrendingUp, Zap, CalendarRange, Building2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Denuncia = Tables<"denuncias">;

interface AnalyticsPanelProps {
  denuncias: Denuncia[];
}

const PERIOD_OPTIONS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Último ano" },
  { value: "custom", label: "Personalizado" },
];

const AnalyticsPanel = ({ denuncias }: AnalyticsPanelProps) => {
  const [period, setPeriod] = useState("30");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [compareSchool1, setCompareSchool1] = useState("all");
  const [compareSchool2, setCompareSchool2] = useState("none");

  const schoolNames = useMemo(() => [...new Set(denuncias.map(d => d.escola))].sort(), [denuncias]);

  // Filter by period
  const filteredDenuncias = useMemo(() => {
    const now = new Date();
    if (period === "custom" && customFrom && customTo) {
      return denuncias.filter(d => {
        const t = new Date(d.created_at);
        return t >= customFrom && t <= customTo;
      });
    }
    const days = parseInt(period) || 30;
    const start = new Date(now.getTime() - days * 86400000);
    return denuncias.filter(d => new Date(d.created_at) >= start);
  }, [denuncias, period, customFrom, customTo]);

  // School filter helper
  const getSchoolData = (data: Denuncia[], school: string) =>
    school === "all" ? data : data.filter(d => d.escola === school);

  const data1 = getSchoolData(filteredDenuncias, compareSchool1);
  const data2 = compareSchool2 !== "none" ? getSchoolData(filteredDenuncias, compareSchool2) : [];

  // Average resolution time
  const calcAvgResolution = (d: Denuncia[]) => {
    const resolved = d.filter(x => x.status === "resolvida" && x.resolved_at);
    if (!resolved.length) return { days: 0, hours: 0, total: 0 };
    const totalHours = resolved.reduce((sum, x) => {
      const diff = new Date(x.resolved_at!).getTime() - new Date(x.created_at).getTime();
      return sum + diff / (1000 * 60 * 60);
    }, 0) / resolved.length;
    return { days: Math.floor(totalHours / 24), hours: Math.round(totalHours % 24), total: resolved.length };
  };

  const avg1 = calcAvgResolution(data1);
  const resolvedCount1 = data1.filter(d => d.status === "resolvida").length;
  const resolutionRate1 = data1.length > 0 ? Math.round(resolvedCount1 / data1.length * 100) : 0;

  // Hourly heatmap data
  const hourCounts = Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, "0")}h`, count: 0 }));
  data1.forEach(d => { hourCounts[new Date(d.created_at).getHours()].count++; });
  const maxHourCount = Math.max(...hourCounts.map(h => h.count), 1);

  // Monthly trends
  const buildMonthlyData = (data: Denuncia[]) => {
    const monthly: Record<string, { total: number; resolvidas: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      monthly[key] = { total: 0, resolvidas: 0 };
    }
    data.forEach(d => {
      const key = new Date(d.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      if (monthly[key]) monthly[key].total++;
      if (d.status === "resolvida" && d.resolved_at) {
        const rKey = new Date(d.resolved_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        if (monthly[rKey]) monthly[rKey].resolvidas++;
      }
    });
    return Object.entries(monthly).map(([month, v]) => ({ month, ...v }));
  };

  const monthlyArray1 = buildMonthlyData(data1);
  const monthlyArray2 = compareSchool2 !== "none" ? buildMonthlyData(data2) : [];

  // Merge for comparison
  const comparisonMonthly = monthlyArray1.map((m, i) => ({
    month: m.month,
    total1: m.total,
    resolvidas1: m.resolvidas,
    total2: monthlyArray2[i]?.total || 0,
    resolvidas2: monthlyArray2[i]?.resolvidas || 0,
  }));

  // Day of week distribution
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dayCounts = Array.from({ length: 7 }, (_, i) => ({ day: dayNames[i], count: 0 }));
  data1.forEach(d => { dayCounts[new Date(d.created_at).getDay()].count++; });

  // Weekly urgency
  const weeklyUrgency: { week: string; alta: number; media: number; baixa: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const start = new Date(Date.now() - (i + 1) * 7 * 86400000);
    const end = new Date(Date.now() - i * 7 * 86400000);
    const week = data1.filter(d => {
      const t = new Date(d.created_at);
      return t >= start && t < end;
    });
    weeklyUrgency.push({
      week: `Sem ${4 - i}`,
      alta: week.filter(d => d.urgencia === "alta").length,
      media: week.filter(d => d.urgencia === "media").length,
      baixa: week.filter(d => d.urgencia === "baixa").length,
    });
  }

  const peakHour = hourCounts.reduce((a, b) => b.count > a.count ? b : a, hourCounts[0]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-display font-bold">📈 Analytics Avançado</h2>
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {data1.length} denúncias no período
        </span>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass p-4 shadow-card flex flex-col sm:flex-row gap-3 flex-wrap items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <CalendarRange className="h-3 w-3" /> Período
          </label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {period === "custom" && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">De</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-36 justify-start rounded-xl text-left font-normal", !customFrom && "text-muted-foreground")}>
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {customFrom ? format(customFrom, "dd/MM/yyyy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Até</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-36 justify-start rounded-xl text-left font-normal", !customTo && "text-muted-foreground")}>
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {customTo ? format(customTo, "dd/MM/yyyy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" /> Escola 1
          </label>
          <Select value={compareSchool1} onValueChange={setCompareSchool1}>
            <SelectTrigger className="w-52 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as escolas</SelectItem>
              {schoolNames.map(s => <SelectItem key={s} value={s}>{s.length > 35 ? s.slice(0, 35) + "…" : s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" /> Comparar com
          </label>
          <Select value={compareSchool2} onValueChange={setCompareSchool2}>
            <SelectTrigger className="w-52 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {schoolNames.map(s => <SelectItem key={s} value={s}>{s.length > 35 ? s.slice(0, 35) + "…" : s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Clock, label: "Tempo Médio Resolução", value: avg1.total > 0 ? `${avg1.days}d ${avg1.hours}h` : "N/A", color: "text-primary" },
          { icon: Zap, label: "Denúncias Resolvidas", value: `${resolvedCount1}`, color: "text-primary" },
          { icon: TrendingUp, label: "Taxa Resolução", value: `${resolutionRate1}%`, color: "text-primary" },
          { icon: Calendar, label: "Horário de Pico", value: peakHour.hour, color: "text-primary" },
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
        {/* Monthly Trends / Comparison */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl glass p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">
            📅 {compareSchool2 !== "none" ? "Comparação Mensal" : "Tendências Mensais"}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            {compareSchool2 !== "none" ? (
              <BarChart data={comparisonMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total1" fill="hsl(142, 73%, 28%)" name={compareSchool1 === "all" ? "Todas (total)" : compareSchool1.slice(0, 20)} radius={[4, 4, 0, 0]} />
                <Bar dataKey="total2" fill="hsl(226, 72%, 40%)" name={compareSchool2.slice(0, 20)} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={monthlyArray1}>
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
            )}
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
