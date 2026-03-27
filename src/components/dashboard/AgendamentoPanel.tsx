import { useState, useEffect } from "react";
import { Calendar, Clock, Plus, CheckCircle2, X, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface AgendamentoPanelProps {
  gestorId: string | null;
  isAdmin: boolean;
}

interface Agendamento {
  id: string;
  denuncia_id: string | null;
  gestor_id: string | null;
  titulo: string;
  descricao: string | null;
  data_hora: string;
  duracao_minutos: number;
  status: string;
  tipo: string;
  created_at: string;
}

const AgendamentoPanel = ({ gestorId, isAdmin }: AgendamentoPanelProps) => {
  const { toast } = useToast();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [duracao, setDuracao] = useState("30");
  const [tipo, setTipo] = useState("presencial");
  const [saving, setSaving] = useState(false);

  const fetchAgendamentos = async () => {
    const { data } = await supabase
      .from("agendamentos")
      .select("*")
      .order("data_hora", { ascending: true });
    if (data) setAgendamentos(data as Agendamento[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAgendamentos();
    const channel = supabase
      .channel("agendamentos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, () => fetchAgendamentos())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCreate = async () => {
    if (!titulo.trim() || !dataHora) {
      toast({ title: "Preencha título e data/hora", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: any = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      data_hora: new Date(dataHora).toISOString(),
      duracao_minutos: parseInt(duracao),
      tipo,
    };
    if (gestorId) payload.gestor_id = gestorId;

    const { error } = await supabase.from("agendamentos").insert(payload);
    if (error) {
      toast({ title: "Erro ao criar agendamento", variant: "destructive" });
    } else {
      toast({ title: "Agendamento criado! 📅" });
      setShowNew(false);
      setTitulo("");
      setDescricao("");
      setDataHora("");
      fetchAgendamentos();
    }
    setSaving(false);
  };

  const handleComplete = async (id: string) => {
    await supabase.from("agendamentos").update({ status: "concluido" }).eq("id", id);
    toast({ title: "Reunião concluída ✅" });
    fetchAgendamentos();
  };

  const handleCancel = async (id: string) => {
    await supabase.from("agendamentos").update({ status: "cancelado" }).eq("id", id);
    toast({ title: "Agendamento cancelado" });
    fetchAgendamentos();
  };

  const upcoming = agendamentos.filter(a => a.status === "agendado" && new Date(a.data_hora) >= new Date());
  const past = agendamentos.filter(a => a.status !== "agendado" || new Date(a.data_hora) < new Date());

  const statusColor = (s: string) => {
    if (s === "agendado") return "bg-secondary/15 text-secondary";
    if (s === "concluido") return "bg-primary/15 text-primary";
    return "bg-destructive/15 text-destructive";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" /> Agendamentos
        </h2>
        <Button onClick={() => setShowNew(true)} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Nova Reunião
        </Button>
      </div>

      {/* Upcoming */}
      <div>
        <h3 className="font-display font-semibold text-sm text-muted-foreground mb-3">PRÓXIMAS REUNIÕES</h3>
        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>Nenhuma reunião agendada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl glass p-5 shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {a.tipo === "presencial" ? <MapPin className="h-4 w-4 text-primary" /> : <Video className="h-4 w-4 text-secondary" />}
                      <span className="font-semibold">{a.titulo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(a.status)}`}>
                        {a.status === "agendado" ? "Agendado" : a.status === "concluido" ? "Concluído" : "Cancelado"}
                      </span>
                    </div>
                    {a.descricao && <p className="text-sm text-muted-foreground truncate">{a.descricao}</p>}
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(a.data_hora).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(a.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ({a.duracao_minutos}min)
                      </span>
                      <span className="capitalize">{a.tipo}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleComplete(a.id)} className="rounded-xl text-primary" title="Concluir">
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleCancel(a.id)} className="rounded-xl text-destructive" title="Cancelar">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm text-muted-foreground mb-3">HISTÓRICO</h3>
          <div className="space-y-2">
            {past.slice(0, 10).map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3 opacity-70">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.data_hora).toLocaleDateString("pt-BR")} — {a.tipo}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(a.status)}`}>
                  {a.status === "concluido" ? "Concluído" : a.status === "cancelado" ? "Cancelado" : "Expirado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New meeting dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Agendar Reunião
            </DialogTitle>
            <DialogDescription>Defina os detalhes da reunião presencial ou virtual.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Título *</label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Reunião sobre caso de bullying" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes adicionais..." rows={2} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Data e Hora *</label>
                <Input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Duração</label>
                <Select value={duracao} onValueChange={setDuracao}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1h30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl">
              {saving ? "Criando..." : "Criar Agendamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendamentoPanel;
