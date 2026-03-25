import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Denuncia = Tables<"denuncias">;

interface NotifItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  urgencia: string;
}

const urgenciaColor: Record<string, string> = {
  alta: "bg-destructive",
  media: "bg-urgency-medium",
  baixa: "bg-primary",
};

const tipoLabels: Record<string, string> = {
  bullying: "Bullying", estrutural: "Estrutural", comunicacao: "Comunicação", outro: "Outro",
};

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [open, setOpen] = useState(false);

  const addNotification = useCallback((d: Denuncia) => {
    const n: NotifItem = {
      id: d.id,
      title: d.urgencia === "alta" ? "🚨 Denúncia Urgente!" : "🔔 Nova denúncia",
      description: `${d.escola} — ${tipoLabels[d.tipo] || d.tipo}`,
      time: new Date(d.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      read: false,
      urgencia: d.urgencia,
    };
    setNotifications((prev) => [n, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    // Load recent as initial notifications
    supabase.from("denuncias").select("*").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => {
        if (data) setNotifications(data.map((d) => ({
          id: d.id,
          title: d.urgencia === "alta" ? "🚨 Denúncia Urgente" : "🔔 Denúncia registrada",
          description: `${d.escola} — ${tipoLabels[d.tipo] || d.tipo}`,
          time: new Date(d.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          read: true,
          urgencia: d.urgencia,
        })));
      });

    const channel = supabase.channel("notif-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "denuncias" }, (payload) => {
        addNotification(payload.new as Denuncia);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) markAllRead(); }}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors" title="Notificações">
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-semibold">Notificações</h4>
          {notifications.length > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Marcar como lidas
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors text-sm ${
                    n.read ? "opacity-70" : "bg-accent/50"
                  }`}
                >
                  <span className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${urgenciaColor[n.urgencia] || "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs">{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
