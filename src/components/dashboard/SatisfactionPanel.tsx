import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Star, TrendingUp, Building2, ThumbsUp, ThumbsDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackRow {
  id: string;
  denuncia_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface DenunciaMinimal {
  id: string;
  escola: string;
}

const SatisfactionPanel = () => {
  const [feedbacks, setFeedbacks] = useState<(FeedbackRow & { escola: string })[]>([]);
  const [gestorSatisfaction, setGestorSatisfaction] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [fbRes, gestorRes] = await Promise.all([
        supabase.from("denuncia_feedback").select("*").order("created_at", { ascending: false }),
        supabase.rpc("get_gestor_satisfaction")
      ]);

      const fb = fbRes.data;
      if (gestorRes.data) setGestorSatisfaction(gestorRes.data);

      if (!fb || fb.length === 0) { setLoading(false); return; }

      const denunciaIds = [...new Set(fb.map(f => f.denuncia_id))];
      const { data: denuncias } = await supabase.from("denuncias").select("id, escola").in("id", denunciaIds);
      const escolaMap: Record<string, string> = {};
      (denuncias || []).forEach((d: DenunciaMinimal) => { escolaMap[d.id] = d.escola; });

      setFeedbacks(fb.map(f => ({ ...f, escola: escolaMap[f.denuncia_id] || "Desconhecida" })));
      setLoading(false);
    };
    load();
  }, []);

  const schoolRatings = useMemo(() => {
    const map: Record<string, { total: number; sum: number; positive: number }> = {};
    feedbacks.forEach(f => {
      if (!map[f.escola]) map[f.escola] = { total: 0, sum: 0, positive: 0 };
      map[f.escola].total++;
      map[f.escola].sum += f.rating;
      if (f.rating >= 4) map[f.escola].positive++;
    });
    return Object.entries(map)
      .map(([escola, s]) => ({
        escola: escola.length > 30 ? escola.slice(0, 30) + "…" : escola,
        fullName: escola,
        avg: Math.round((s.sum / s.total) * 10) / 10,
        total: s.total,
        satisfactionRate: Math.round((s.positive / s.total) * 100),
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [feedbacks]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, { sum: number; count: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      months[key] = { sum: 0, count: 0 };
    }
    feedbacks.forEach(f => {
      const key = new Date(f.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      if (months[key]) { months[key].sum += f.rating; months[key].count++; }
    });
    return Object.entries(months).map(([month, v]) => ({
      month,
      avg: v.count > 0 ? Math.round((v.sum / v.count) * 10) / 10 : 0,
      count: v.count,
    }));
  }, [feedbacks]);

  const overallAvg = feedbacks.length > 0
    ? Math.round((feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length) * 10) / 10
    : 0;
  const positiveCount = feedbacks.filter(f => f.rating >= 4).length;
  const negativeCount = feedbacks.filter(f => f.rating <= 2).length;

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold flex items-center gap-2">
        <Star className="h-6 w-6 text-warning" /> Métricas de Satisfação
      </h2>

      {feedbacks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg">Nenhum feedback recebido ainda</p>
          <p className="text-sm mt-1">As avaliações aparecerão quando denunciantes avaliarem o atendimento</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Star, label: "Nota Média Geral", value: `${overallAvg}/5`, color: "text-warning" },
              { icon: ThumbsUp, label: "Avaliações Positivas", value: `${positiveCount}`, color: "text-primary" },
              { icon: ThumbsDown, label: "Avaliações Negativas", value: `${negativeCount}`, color: "text-destructive" },
              { icon: TrendingUp, label: "Total de Avaliações", value: `${feedbacks.length}`, color: "text-secondary" },
            ].map((kpi, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl glass p-5 shadow-card">
                <kpi.icon className={`h-5 w-5 ${kpi.color} mb-2`} />
                <p className="text-2xl font-display font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gestor Rankings */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl glass p-6 shadow-card">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Nota Média por Gestor
              </h3>
              <div className="space-y-4">
                {gestorSatisfaction.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8 italic">Nenhuma nota registrada para gestores individuais ainda.</p>
                ) : (
                  gestorSatisfaction.map((g, i) => (
                    <div key={i} className="flex items-center gap-4 bg-muted/30 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {g.media_satisfacao}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{g.gestor_nome}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{g.escola_nome}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-muted-foreground">{g.total_feedbacks} avaliações</p>
                            <div className="flex gap-0.5 mt-0.5">
                                {Array.from({ length: 5 }, (_, s) => (
                                    <Star key={s} className={`h-2.5 w-2.5 ${s < Math.floor(g.media_satisfacao) ? "text-warning fill-warning" : "text-muted"}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Monthly Trend */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl glass p-6 shadow-card">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" /> Tendência de Satisfação
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v}/5`, "Nota Média"]} />
                  <Line type="monotone" dataKey="avg" stroke="hsl(38, 92%, 50%)" strokeWidth={3} dot={{ fill: "hsl(38, 92%, 50%)", r: 4 }} name="Nota Média" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Recent Feedback */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="rounded-2xl glass p-6 shadow-card">
            <h3 className="font-display font-semibold mb-4">💬 Últimos Feedbacks</h3>
            <div className="space-y-3">
              {feedbacks.slice(0, 8).map((f, i) => (
                <div key={f.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      f.rating >= 4 ? "bg-primary/15 text-primary" : f.rating >= 3 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"
                    }`}>
                      {f.rating}/5
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.escola}</p>
                    {f.comment && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{f.comment}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(f.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star key={s} className={`h-3 w-3 ${s < f.rating ? "text-warning fill-warning" : "text-muted"}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default SatisfactionPanel;
