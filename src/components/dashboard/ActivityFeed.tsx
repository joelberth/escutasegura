import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Clock, CheckCircle2, AlertCircle, MessageSquare, UserPlus, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActivityItem {
  id: string;
  type: "status_change" | "response" | "new_denuncia" | "gestor_approved";
  description: string;
  timestamp: string;
  meta?: string;
}

const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Fetch audit logs + recent denuncias for activity feed
      const [auditRes, denunciaRes] = await Promise.all([
        supabase.from("denuncia_audit_log").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("denuncias").select("id, codigo_acompanhamento, escola, created_at, tipo").order("created_at", { ascending: false }).limit(10),
      ]);

      const items: ActivityItem[] = [];

      (auditRes.data || []).forEach(a => {
        items.push({
          id: `audit-${a.id}`,
          type: a.action === "status_change" ? "status_change" : "response",
          description: a.details || a.action,
          timestamp: a.created_at,
          meta: a.denuncia_id,
        });
      });

      (denunciaRes.data || []).forEach(d => {
        items.push({
          id: `den-${d.id}`,
          type: "new_denuncia",
          description: `Nova denúncia: ${d.codigo_acompanhamento} — ${d.escola}`,
          timestamp: d.created_at,
        });
      });

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(items.slice(0, 20));
      setLoading(false);
    };
    load();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "status_change": return <AlertCircle className="h-3.5 w-3.5 text-secondary" />;
      case "response": return <MessageSquare className="h-3.5 w-3.5 text-primary" />;
      case "new_denuncia": return <Shield className="h-3.5 w-3.5 text-urgency-medium" />;
      case "gestor_approved": return <UserPlus className="h-3.5 w-3.5 text-primary" />;
      default: return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (loading) return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-display font-semibold flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" /> Atividade Recente
      </h3>
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade registrada</p>
      ) : (
        <div className="space-y-1">
          {activities.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="mt-0.5 flex-shrink-0">{getIcon(a.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{a.description}</p>
              </div>
              <span className="text-[10px] text-muted-foreground flex-shrink-0 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {timeAgo(a.timestamp)}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
