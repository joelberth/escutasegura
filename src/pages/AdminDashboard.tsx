import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, BarChart3, Settings, LogOut, Eye, MessageSquare, CheckCircle2,
  Download, Clock, AlertCircle, Filter, Building2, UserCheck, FileText, MapPin, KeyRound,
  Bell, BellOff, TrendingUp, User, Users, PieChart as PieChartIcon, Calendar
} from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";
import AdminEscolas from "@/pages/AdminEscolas";
import AdminLogs from "@/pages/AdminLogs";
import StatsCards from "@/components/dashboard/StatsCards";
import ProgressRing from "@/components/dashboard/ProgressRing";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import ChatPanel from "@/components/dashboard/ChatPanel";
import AdminUsuarios from "@/pages/AdminUsuarios";
import NotificationsDropdown from "@/components/dashboard/NotificationsDropdown";
import AgendamentoPanel from "@/components/dashboard/AgendamentoPanel";
import SatisfactionPanel from "@/components/dashboard/SatisfactionPanel";

type Denuncia = Tables<"denuncias">;

const statusLabels: Record<string, string> = { pendente: "Pendente", em_analise: "Em Análise", resolvida: "Resolvida" };
const tipoLabels: Record<string, string> = { bullying: "Bullying", estrutural: "Estrutural", comunicacao: "Comunicação", outro: "Outro" };
const urgenciaLabels: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta" };
const tipoGestorLabels: Record<string, string> = {
  geral: "Gestor Geral", administrativo: "Gestor Administrativo",
  financeiro: "Gestor Financeiro", administrativo_financeiro: "Gestor Adm. e Financeiro",
};

const CHART_COLORS = ["hsl(142, 73%, 28%)", "hsl(226, 72%, 40%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

type TabKey = "denuncias" | "stats" | "analytics" | "satisfacao" | "escolas" | "aprovacoes" | "logs" | "mapa" | "solicitacoes" | "usuarios" | "agendamentos" | "config";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { permission, supported, requestPermission, sendNotification } = usePushNotifications();
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabKey>("denuncias");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEscola, setFilterEscola] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [gestorEscola, setGestorEscola] = useState<string | null>(null);
  const [gestorId, setGestorId] = useState<string | null>(null);
  const [escolas, setEscolas] = useState<{ id: string; nome: string }[]>([]);
  const [selectedDenuncia, setSelectedDenuncia] = useState<Denuncia | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);
  const [pendingGestores, setPendingGestores] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);

  const fetchDenuncias = async (escolaFilter?: string | null) => {
    let query = supabase.from("denuncias").select("*").order("created_at", { ascending: false });
    if (escolaFilter) query = query.eq("escola", escolaFilter);
    const { data } = await query;
    if (data) setDenuncias(data);
    setLoading(false);
  };

  const fetchEscolas = async () => {
    const { data } = await supabase.from("escolas").select("id, nome").order("nome");
    if (data) setEscolas(data);
  };

  const fetchPendingGestores = async () => {
    const { data } = await supabase.from("gestores").select("*, escolas(nome)").eq("approved", false).order("created_at", { ascending: false });
    if (data) setPendingGestores(data);
  };

  const fetchAccessRequests = async () => {
    const { data } = await supabase
      .from("log_access_requests")
      .select("*, gestores(nome, email, escolas(nome)), denuncias(codigo_acompanhamento, escola, ip_address, device_info, location_info)")
      .eq("status", "pendente")
      .order("created_at", { ascending: false });
    if (data) setAccessRequests(data);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { navigate("/admin/login"); return; }
      setUserId(user.id);
      const { data: adminRole } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (adminRole) {
        setIsAdmin(true);
        setUserName("Admin");
        fetchDenuncias();
        fetchEscolas();
        fetchPendingGestores();
        fetchAccessRequests();
      } else {
        const { data: gestorData } = await supabase
          .from("gestores")
          .select("id, nome, escola_id, approved, escolas(nome)")
          .eq("user_id", user.id)
          .single();
        if (!gestorData || !gestorData.approved) {
          await supabase.auth.signOut();
          toast({ title: "Acesso negado", description: "Sua conta ainda não foi aprovada.", variant: "destructive" });
          navigate("/admin/login");
          return;
        }
        const escolaNome = (gestorData.escolas as any)?.nome || null;
        setGestorEscola(escolaNome);
        setGestorId(gestorData.id);
        setUserName(gestorData.nome || "Gestor");
        fetchDenuncias(escolaNome);
        fetchEscolas();
      }
    });

    const channel = supabase.channel("denuncias-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "denuncias" }, (payload) => {
        const nova = payload.new as Denuncia;
        const title = nova.urgencia === "alta"
          ? "🚨 DENÚNCIA URGENTE!"
          : "🔔 Nova denúncia recebida!";
        const desc = `${nova.escola} — ${tipoLabels[nova.tipo] || nova.tipo}`;
        toast({ title, description: desc });
        sendNotification(title, { body: desc, tag: nova.id });
        if (gestorEscola) fetchDenuncias(gestorEscola);
        else fetchDenuncias();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "denuncias" }, () => {
        if (gestorEscola) fetchDenuncias(gestorEscola);
        else fetchDenuncias();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  const handleApproveGestor = async (gestor: any) => {
    await supabase.from("gestores").update({ approved: true }).eq("id", gestor.id);
    if (gestor.user_id) {
      await supabase.from("user_roles").insert({ user_id: gestor.user_id, role: "user" as const });
    }
    toast({ title: `${gestor.nome} aprovado ✅` });
    fetchPendingGestores();
  };

  const handleRejectGestor = async (gestor: any) => {
    await supabase.from("gestores").delete().eq("id", gestor.id);
    toast({ title: "Cadastro rejeitado" });
    fetchPendingGestores();
  };

  const handleApproveAccess = async (req: any) => {
    await supabase.from("log_access_requests").update({ status: "aprovado", resolved_at: new Date().toISOString() }).eq("id", req.id);
    toast({ title: "Acesso aprovado ✅" });
    fetchAccessRequests();
  };

  const handleRejectAccess = async (req: any) => {
    await supabase.from("log_access_requests").update({ status: "rejeitado", resolved_at: new Date().toISOString() }).eq("id", req.id);
    toast({ title: "Solicitação rejeitada" });
    fetchAccessRequests();
  };

  const handleRequestAccess = async (denunciaId: string) => {
    if (!gestorId) return;
    const { error } = await supabase.from("log_access_requests").insert({
      gestor_id: gestorId,
      denuncia_id: denunciaId,
    });
    if (error) {
      if (error.code === "23505") toast({ title: "Solicitação já enviada", variant: "destructive" });
      else toast({ title: "Erro ao solicitar", variant: "destructive" });
    } else {
      toast({ title: "Solicitação enviada ao administrador ✅" });
    }
  };

  const filtered = denuncias.filter((d) => {
    if (filterTipo !== "all" && d.tipo !== filterTipo) return false;
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (filterEscola !== "all" && d.escola !== filterEscola) return false;
    if (searchText && !d.escola.toLowerCase().includes(searchText.toLowerCase()) && !d.codigo_acompanhamento.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const handleRespond = async () => {
    if (!selectedDenuncia || !responseText.trim()) return;
    setResponding(true);
    await supabase.from("denuncias").update({ response_text: responseText, status: "em_analise" as const }).eq("id", selectedDenuncia.id);
    toast({ title: "Resposta enviada!" });
    setSelectedDenuncia(null);
    setResponseText("");
    setResponding(false);
    fetchDenuncias(gestorEscola);
  };

  const handleResolve = async (id: string) => {
    await supabase.from("denuncias").update({ status: "resolvida" as const, resolved_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Denúncia marcada como resolvida ✅" });
    fetchDenuncias(gestorEscola);
  };

  const exportCSV = () => {
    const headers = ["Código,Tipo,Escola,Urgência,Status,Data,Descrição"];
    const rows = filtered.map((d) =>
      `${d.codigo_acompanhamento},${d.tipo},"${d.escola.replace(/"/g, '""')}",${d.urgencia},${d.status},${new Date(d.created_at).toLocaleDateString("pt-BR")},"${d.descricao.replace(/"/g, '""')}"`
    );
    const csv = [...headers, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `denuncias-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDashboardPDF = () => {
    const statusData = Object.entries(statusLabels).map(([k, v]) => ({
      label: v, count: denuncias.filter(d => d.status === k).length,
    }));
    const tipoData = Object.entries(tipoLabels).map(([k, v]) => ({
      label: v, count: denuncias.filter(d => d.tipo === k).length,
    }));
    const urgData = Object.entries(urgenciaLabels).map(([k, v]) => ({
      label: v, count: denuncias.filter(d => d.urgencia === k).length,
    }));
    const topEscolas = (() => {
      const counts: Record<string, number> = {};
      denuncias.forEach(d => { counts[d.escola] = (counts[d.escola] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    })();

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dashboard - Escola Segura Report</title>
    <style>
      body{font-family:Arial,sans-serif;padding:30px;color:#1a1a1a;font-size:13px}
      h1{font-size:22px;color:#15803d;margin-bottom:4px}
      h2{font-size:16px;margin-top:28px;margin-bottom:10px;color:#1e40af;border-bottom:2px solid #e5e7eb;padding-bottom:4px}
      .subtitle{color:#666;font-size:13px;margin-bottom:24px}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
      .stat{border:1px solid #e5e7eb;border-radius:10px;padding:14px;text-align:center}
      .stat .num{font-size:28px;font-weight:bold;color:#15803d}
      .stat .lbl{font-size:11px;color:#666;margin-top:2px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{border:1px solid #ddd;padding:6px 10px;text-align:left;font-size:12px}
      th{background:#f5f5f5;font-weight:600}
      .bar-row{display:flex;align-items:center;gap:8px;margin:3px 0}
      .bar-label{width:200px;font-size:12px;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .bar-fill{height:18px;background:#1e40af;border-radius:4px;min-width:4px}
      .bar-val{font-size:11px;color:#666;width:30px}
      @media print{body{padding:10px}.stats{grid-template-columns:repeat(2,1fr)}}
    </style></head><body>
    <h1>📊 Relatório do Dashboard — Escola Segura Report</h1>
    <p class="subtitle">Gerado em ${new Date().toLocaleString("pt-BR")} • Total: ${denuncias.length} denúncias</p>
    <div class="stats">
      <div class="stat"><div class="num">${denuncias.length}</div><div class="lbl">Total</div></div>
      <div class="stat"><div class="num">${totalPending}</div><div class="lbl">Pendentes</div></div>
      <div class="stat"><div class="num">${resolvedThisWeek}</div><div class="lbl">Resolvidas (7d)</div></div>
      <div class="stat"><div class="num">${satisfaction}%</div><div class="lbl">Taxa Resolução</div></div>
    </div>
    <h2>Por Status</h2>
    <table><tr><th>Status</th><th>Quantidade</th><th>%</th></tr>
    ${statusData.map(s => `<tr><td>${s.label}</td><td>${s.count}</td><td>${denuncias.length ? Math.round(s.count / denuncias.length * 100) : 0}%</td></tr>`).join("")}
    </table>
    <h2>Por Tipo</h2>
    <table><tr><th>Tipo</th><th>Quantidade</th></tr>
    ${tipoData.map(t => `<tr><td>${t.label}</td><td>${t.count}</td></tr>`).join("")}
    </table>
    <h2>Por Urgência</h2>
    <table><tr><th>Urgência</th><th>Quantidade</th></tr>
    ${urgData.map(u => `<tr><td>${u.label}</td><td>${u.count}</td></tr>`).join("")}
    </table>
    <h2>Top 10 Escolas</h2>
    ${topEscolas.map(([nome, total]) => `<div class="bar-row"><div class="bar-label">${nome}</div><div class="bar-fill" style="width:${Math.max(4, (total / (topEscolas[0]?.[1] || 1)) * 200)}px"></div><div class="bar-val">${total}</div></div>`).join("")}
    <script>window.print();</script>
    </body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  // Computed stats
  const today = new Date().toDateString();
  const totalToday = denuncias.filter((d) => new Date(d.created_at).toDateString() === today).length;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const resolvedThisWeek = denuncias.filter((d) => d.status === "resolvida" && d.resolved_at && new Date(d.resolved_at) >= weekAgo).length;
  const totalResolved = denuncias.filter((d) => d.status === "resolvida").length;
  const totalPending = denuncias.filter((d) => d.status === "pendente").length;
  const totalHighUrgency = denuncias.filter((d) => d.urgencia === "alta").length;
  const satisfaction = denuncias.length > 0 ? Math.round((totalResolved / denuncias.length) * 100) : 0;

  const chartData = Object.entries(tipoLabels).map(([key, label]) => ({
    name: label, total: denuncias.filter((d) => d.tipo === key).length,
  }));

  const pieData = Object.entries(statusLabels).map(([key, label]) => ({
    name: label, value: denuncias.filter((d) => d.status === key).length,
  })).filter(d => d.value > 0);

  const timelineData = (() => {
    const days: Record<string, { total: number; resolvidas: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      days[key] = { total: 0, resolvidas: 0 };
    }
    denuncias.forEach((d) => {
      const key = new Date(d.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (days[key]) days[key].total++;
      if (d.status === "resolvida" && d.resolved_at) {
        const rKey = new Date(d.resolved_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        if (days[rKey]) days[rKey].resolvidas++;
      }
    });
    return Object.entries(days).map(([date, vals]) => ({ date, ...vals }));
  })();

  const escolaNames = [...new Set(denuncias.map((d) => d.escola))].sort();

  const locationData = denuncias
    .filter((d) => d.location_info && d.location_info !== "Não disponível")
    .reduce((acc, d) => {
      const loc = d.location_info!;
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const sidebarItems: { key: TabKey; label: string; icon: any; badge?: number }[] = [
    { key: "denuncias", label: "Denúncias", icon: Shield },
    ...(isAdmin ? [{ key: "escolas" as TabKey, label: "Escolas", icon: Building2 }] : []),
    ...(isAdmin ? [{ key: "aprovacoes" as TabKey, label: "Aprovações", icon: UserCheck, badge: pendingGestores.length }] : []),
    { key: "agendamentos", label: "Agendamentos", icon: Calendar },
    { key: "stats", label: "Estatísticas", icon: BarChart3 },
    { key: "analytics", label: "Analytics", icon: PieChartIcon },
    ...(isAdmin ? [{ key: "mapa" as TabKey, label: "Mapa", icon: MapPin }] : []),
    ...(isAdmin ? [{ key: "logs" as TabKey, label: "Logs", icon: FileText }] : []),
    ...(isAdmin ? [{ key: "solicitacoes" as TabKey, label: "Solicitações", icon: KeyRound, badge: accessRequests.length }] : []),
    ...(isAdmin ? [{ key: "usuarios" as TabKey, label: "Usuários", icon: Users }] : []),
    ...(isAdmin ? [{ key: "config" as TabKey, label: "Configurações", icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border glass-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 p-5 border-b border-sidebar-border">
          <Shield className="h-6 w-6 text-sidebar-primary" />
          <span className="font-display font-bold text-sm">Escola Segura Report</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.key
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70"
              }`}
            >
              <item.icon className="h-4 w-4" /> {item.label}
              {item.badge && item.badge > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center justify-between px-3">
            <DarkModeToggle />
            <NotificationsDropdown />
            <button onClick={() => navigate("/perfil")} className="p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors" title="Perfil">
              <User className="h-4 w-4" />
            </button>
          </div>
          {/* Push notification toggle */}
          {supported && (
            <button
              onClick={async () => {
                if (permission !== "granted") {
                  const granted = await requestPermission();
                  toast({ title: granted ? "Notificações ativadas! 🔔" : "Notificações bloqueadas" });
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs hover:bg-sidebar-accent/50 transition-colors"
            >
              {permission === "granted"
                ? <><Bell className="h-3.5 w-3.5 text-primary" /> Notificações ativas</>
                : <><BellOff className="h-3.5 w-3.5" /> Ativar notificações</>
              }
            </button>
          )}
          <p className="text-xs text-muted-foreground px-3">
            {isAdmin ? "👑 Admin" : gestorEscola ? `📋 ${gestorEscola}` : ""}
          </p>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-sidebar-accent/50 transition-colors">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden flex items-center justify-between p-3 border-b border-border gap-2">
          <div className="flex items-center gap-2 font-display font-bold text-sm flex-shrink-0">
            <Shield className="h-5 w-5 text-primary" /> Painel
          </div>
          <div className="flex items-center gap-1">
            <NotificationsDropdown />
            <DarkModeToggle />
          </div>
        </header>
        {/* Mobile tab bar */}
        <div className="md:hidden flex overflow-x-auto border-b border-border px-2 py-1.5 gap-0.5 scrollbar-hide">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === item.key ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-muted-foreground whitespace-nowrap">
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {/* Stats Tab */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold">📊 Estatísticas</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exportDashboardPDF} className="gap-1.5 rounded-xl">
                    <Download className="h-4 w-4" /> Exportar PDF
                  </Button>
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    Atualizado em tempo real
                  </span>
                </div>
              </div>

              <StatsCards
                total={denuncias.length}
                today={totalToday}
                resolvedWeek={resolvedThisWeek}
                satisfaction={satisfaction}
                pending={totalPending}
                highUrgency={totalHighUrgency}
              />

              {/* Performance rings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl glass p-6 shadow-card"
              >
                <h3 className="font-display font-semibold mb-6">Performance Geral</h3>
                <div className="flex flex-wrap justify-center gap-8">
                  <ProgressRing value={totalResolved} max={denuncias.length} label="Taxa de Resolução" color="hsl(142, 73%, 28%)" />
                  <ProgressRing value={denuncias.filter(d => d.status === "em_analise").length} max={denuncias.length} label="Em Análise" color="hsl(226, 72%, 40%)" />
                  <ProgressRing value={totalPending} max={denuncias.length} label="Pendentes" color="hsl(38, 92%, 50%)" />
                  <ProgressRing value={totalHighUrgency} max={denuncias.length} label="Urgência Alta" color="hsl(0, 84%, 60%)" />
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl glass p-6 shadow-card">
                  <h3 className="font-display font-semibold mb-4">Distribuição por Status</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine>
                        {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Bar chart */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl glass p-6 shadow-card">
                  <h3 className="font-display font-semibold mb-4">Denúncias por Tipo</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                        {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Timeline */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl glass p-6 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="font-display font-semibold">Timeline — Últimos 30 dias</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 73%, 28%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 73%, 28%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorResolvidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(226, 72%, 40%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(226, 72%, 40%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="total" stroke="hsl(142, 73%, 28%)" fill="url(#colorTotal)" strokeWidth={2} name="Novas" />
                    <Area type="monotone" dataKey="resolvidas" stroke="hsl(226, 72%, 40%)" fill="url(#colorResolvidas)" strokeWidth={2} name="Resolvidas" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Interactive line chart by category */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="rounded-2xl glass p-6 shadow-card">
                <h3 className="font-display font-semibold mb-4">📈 Tendência por Categoria (30 dias)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={(() => {
                    const days: Record<string, Record<string, number>> = {};
                    for (let i = 29; i >= 0; i--) {
                      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                      const key = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                      days[key] = { bullying: 0, estrutural: 0, comunicacao: 0, outro: 0 };
                    }
                    denuncias.forEach((d) => {
                      const key = new Date(d.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                      if (days[key]) days[key][d.tipo] = (days[key][d.tipo] || 0) + 1;
                    });
                    return Object.entries(days).map(([date, vals]) => ({ date, ...vals }));
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="bullying" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} name="Bullying" />
                    <Line type="monotone" dataKey="estrutural" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} name="Estrutural" />
                    <Line type="monotone" dataKey="comunicacao" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} name="Comunicação" />
                    <Line type="monotone" dataKey="outro" stroke={CHART_COLORS[3]} strokeWidth={2} dot={false} name="Outro" />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {isAdmin && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-2xl glass p-6 shadow-card">
                  <h3 className="font-display font-semibold mb-4">🏫 Top 10 Escolas</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={(() => {
                        const counts: Record<string, number> = {};
                        denuncias.forEach((d) => { counts[d.escola] = (counts[d.escola] || 0) + 1; });
                        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10)
                          .map(([escola, total]) => ({ name: escola.length > 25 ? escola.slice(0, 25) + "…" : escola, total }));
                      })()}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={180} />
                      <Tooltip />
                      <Bar dataKey="total" fill="hsl(226, 72%, 40%)" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && <AnalyticsPanel denuncias={denuncias} />}

          {/* Agendamentos Tab */}
          {activeTab === "agendamentos" && <AgendamentoPanel gestorId={gestorId} isAdmin={isAdmin} />}

          {/* Escolas Tab */}
          {activeTab === "escolas" && isAdmin && <AdminEscolas />}

          {/* Aprovações Tab */}
          {activeTab === "aprovacoes" && isAdmin && (
            <div className="space-y-6">
              <h2 className="text-2xl font-display font-bold">✅ Aprovações de Gestores</h2>
              {pendingGestores.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-lg">Nenhum cadastro pendente</p>
                  <p className="text-sm mt-1">Todos os gestores foram processados 🎉</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {pendingGestores.map((g, i) => (
                    <motion.div key={g.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="rounded-2xl glass p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-elevated transition-shadow">
                      <div>
                        <p className="font-semibold">{g.nome}</p>
                        <p className="text-sm text-muted-foreground">{g.email} • {tipoGestorLabels[g.tipo]}</p>
                        <p className="text-sm text-muted-foreground">🏫 {(g.escolas as any)?.nome || "—"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproveGestor(g)} className="gap-1.5 rounded-xl">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectGestor(g)} className="gap-1.5 rounded-xl text-destructive hover:bg-destructive/10">
                          Rejeitar
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === "logs" && isAdmin && <AdminLogs />}

          {/* Mapa Tab */}
          {activeTab === "mapa" && isAdmin && (
            <div className="space-y-6">
              <h2 className="text-2xl font-display font-bold">🗺️ Mapa de Denúncias</h2>
              {/* Coordinate-based map links */}
              {denuncias.filter(d => (d as any).latitude).length > 0 && (
                <div className="rounded-2xl glass p-6 shadow-card">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Localizações com GPS
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {denuncias.filter(d => (d as any).latitude).map((d, i) => (
                      <motion.a
                        key={d.id}
                        href={`https://www.google.com/maps?q=${(d as any).latitude},${(d as any).longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="rounded-xl border border-border bg-card p-3 flex items-center gap-3 hover:shadow-elevated transition-all group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-muted-foreground">{d.codigo_acompanhamento}</p>
                          <p className="text-sm font-medium truncate">{d.escola}</p>
                          <p className="text-xs text-muted-foreground">{d.location_info || "GPS disponível"}</p>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(locationData).length === 0 && denuncias.filter(d => (d as any).latitude).length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhuma denúncia com localização disponível.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(locationData)
                      .sort((a, b) => b[1] - a[1])
                      .map(([location, count], i) => (
                        <motion.div key={location} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                          className="rounded-2xl glass p-5 shadow-card flex items-center gap-4 hover:shadow-elevated transition-all cursor-pointer"
                          onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(location)}`, "_blank")}
                        >
                          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-6 w-6 text-accent-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">{location}</p>
                            <p className="text-xs text-muted-foreground">{count} denúncia{count > 1 ? "s" : ""}</p>
                          </div>
                          <div className="text-2xl font-display font-bold text-primary">{count}</div>
                        </motion.div>
                      ))}
                  </div>
                  <div className="rounded-2xl glass p-6 shadow-card">
                    <h3 className="font-display font-semibold mb-4">Ranking de Localizações</h3>
                    <ResponsiveContainer width="100%" height={Math.max(200, Object.keys(locationData).length * 40)}>
                      <BarChart data={Object.entries(locationData).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, total]) => ({ name: name.length > 30 ? name.slice(0, 30) + "…" : name, total }))} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={200} />
                        <Tooltip />
                        <Bar dataKey="total" fill="hsl(142, 73%, 28%)" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {/* School Achievements */}
              <div className="rounded-2xl glass p-6 shadow-card">
                <h3 className="font-display font-semibold mb-4">🏅 Conquistas das Escolas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(() => {
                    const schoolStats: Record<string, { total: number; resolved: number; avgDays: number }> = {};
                    denuncias.forEach((d) => {
                      if (!schoolStats[d.escola]) schoolStats[d.escola] = { total: 0, resolved: 0, avgDays: 0 };
                      schoolStats[d.escola].total++;
                      if (d.status === "resolvida") {
                        schoolStats[d.escola].resolved++;
                        if (d.resolved_at) {
                          const days = (new Date(d.resolved_at).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
                          schoolStats[d.escola].avgDays += days;
                        }
                      }
                    });

                    return Object.entries(schoolStats)
                      .map(([escola, stats]) => {
                        const rate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
                        const avgDays = stats.resolved > 0 ? Math.round(stats.avgDays / stats.resolved) : 0;
                        const medals: string[] = [];
                        if (rate >= 90) medals.push("🥇 Excelência");
                        else if (rate >= 70) medals.push("🥈 Destaque");
                        else if (rate >= 50) medals.push("🥉 Progresso");
                        if (avgDays <= 3 && stats.resolved > 0) medals.push("⚡ Resposta Rápida");
                        if (stats.resolved >= 10) medals.push("🏆 Veterana");
                        return { escola, ...stats, rate, avgDays, medals };
                      })
                      .filter(s => s.medals.length > 0)
                      .sort((a, b) => b.rate - a.rate)
                      .slice(0, 9)
                      .map((s, i) => (
                        <motion.div
                          key={s.escola}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="rounded-xl border border-border bg-card p-4 space-y-2"
                        >
                          <p className="text-sm font-medium truncate">{s.escola}</p>
                          <div className="flex flex-wrap gap-1">
                            {s.medals.map((m) => (
                              <span key={m} className="text-xs bg-accent px-2 py-0.5 rounded-full">{m}</span>
                            ))}
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{s.rate}% resolvidas</span>
                            {s.resolved > 0 && <span>~{s.avgDays}d resposta</span>}
                          </div>
                        </motion.div>
                      ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Solicitações Tab */}
          {activeTab === "solicitacoes" && isAdmin && (
            <div className="space-y-6">
              <h2 className="text-2xl font-display font-bold">🔐 Solicitações de Acesso</h2>
              {accessRequests.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <KeyRound className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhuma solicitação pendente.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accessRequests.map((req, i) => (
                    <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="rounded-2xl glass p-5 shadow-card space-y-3 hover:shadow-elevated transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{(req.gestores as any)?.nome || "Gestor"}</p>
                          <p className="text-sm text-muted-foreground">{(req.gestores as any)?.email} • 🏫 {(req.gestores as any)?.escolas?.nome || "—"}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Código: <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{(req.denuncias as any)?.codigo_acompanhamento}</span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApproveAccess(req)} className="gap-1.5 rounded-xl">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectAccess(req)} className="gap-1.5 rounded-xl text-destructive">
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3 space-y-1 border border-border/50">
                        <p><strong>IP:</strong> {(req.denuncias as any)?.ip_address || "N/D"}</p>
                        <p><strong>Dispositivo:</strong> {(req.denuncias as any)?.device_info || "N/D"}</p>
                        <p><strong>Localização:</strong> {(req.denuncias as any)?.location_info || "N/D"}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Usuários Tab */}
          {activeTab === "usuarios" && isAdmin && <AdminUsuarios />}

          {/* Config Tab */}
          {activeTab === "config" && isAdmin && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-2xl font-display font-bold">⚙️ Configurações</h2>
              <div className="rounded-2xl glass p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações Push</p>
                    <p className="text-sm text-muted-foreground">Receba alertas no navegador</p>
                  </div>
                  <Button
                    variant={permission === "granted" ? "outline" : "default"}
                    size="sm"
                    onClick={async () => {
                      const granted = await requestPermission();
                      toast({ title: granted ? "Ativado! 🔔" : "Bloqueado pelo navegador" });
                    }}
                    className="rounded-xl"
                  >
                    {permission === "granted" ? "Ativo ✅" : "Ativar"}
                  </Button>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">
                    Mais configurações estarão disponíveis em breve.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Denúncias Tab */}
          {activeTab === "denuncias" && (
            <div className="space-y-6">
              {/* Quick stats at top */}
              <StatsCards
                total={denuncias.length}
                today={totalToday}
                resolvedWeek={resolvedThisWeek}
                satisfaction={satisfaction}
                pending={totalPending}
                highUrgency={totalHighUrgency}
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-display font-bold">
                  📋 Denúncias {gestorEscola && <span className="text-base font-normal text-muted-foreground">— {gestorEscola}</span>}
                </h2>
                <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2 rounded-xl">
                  <Download className="h-4 w-4" /> Exportar CSV
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterTipo} onValueChange={setFilterTipo}>
                    <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {Object.entries(tipoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                {isAdmin && (
                  <Select value={filterEscola} onValueChange={setFilterEscola}>
                    <SelectTrigger className="w-56 rounded-xl"><SelectValue placeholder="Escola" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as escolas</SelectItem>
                      {escolaNames.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Buscar escola ou código..." className="sm:max-w-xs rounded-xl" />
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-lg">Nenhuma denúncia encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((d, i) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className={`rounded-2xl border bg-card p-4 shadow-card hover:shadow-elevated transition-all duration-200 ${
                        d.urgencia === "alta" ? "border-destructive/30" : "border-border"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-mono text-xs font-semibold bg-muted px-2 py-0.5 rounded-lg">{d.codigo_acompanhamento}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                              d.status === "pendente" ? "bg-urgency-medium/15 text-urgency-medium" :
                              d.status === "em_analise" ? "bg-secondary/15 text-secondary" :
                              "bg-primary/15 text-primary"
                            }`}>
                              {d.status === "pendente" && <Clock className="h-3 w-3 inline mr-1" />}
                              {d.status === "em_analise" && <AlertCircle className="h-3 w-3 inline mr-1" />}
                              {d.status === "resolvida" && <CheckCircle2 className="h-3 w-3 inline mr-1" />}
                              {statusLabels[d.status]}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              d.urgencia === "alta" ? "bg-destructive/15 text-destructive" :
                              d.urgencia === "media" ? "bg-urgency-medium/15 text-urgency-medium" :
                              "bg-primary/15 text-primary"
                            }`}>
                              {urgenciaLabels[d.urgencia]}
                            </span>
                          </div>
                          <p className="text-sm font-medium truncate">{d.escola}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{tipoLabels[d.tipo]} • {new Date(d.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedDenuncia(d); setResponseText(d.response_text || ""); }} className="rounded-xl">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {d.status !== "resolvida" && (
                            <Button variant="ghost" size="sm" onClick={() => handleResolve(d.id)} className="rounded-xl text-primary">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {!isAdmin && (
                            <Button variant="ghost" size="sm" onClick={() => handleRequestAccess(d.id)} title="Solicitar detalhes" className="rounded-xl">
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedDenuncia} onOpenChange={() => setSelectedDenuncia(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Denúncia</DialogTitle>
            <DialogDescription>{selectedDenuncia?.codigo_acompanhamento}</DialogDescription>
          </DialogHeader>
          {selectedDenuncia && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{tipoLabels[selectedDenuncia.tipo]}</span></div>
                <div><span className="text-muted-foreground">Urgência:</span> <span className="font-medium">{urgenciaLabels[selectedDenuncia.urgencia]}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Escola:</span> <span className="font-medium">{selectedDenuncia.escola}</span></div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                <p className="text-sm bg-muted rounded-xl p-3">{selectedDenuncia.descricao}</p>
              </div>
              {selectedDenuncia.arquivo_urls && selectedDenuncia.arquivo_urls.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Evidências</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDenuncia.arquivo_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary underline">
                        Arquivo {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Responder anonimamente
                </label>
                <Textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Escreva uma resposta..." rows={3} className="rounded-xl" />
                <Button onClick={handleRespond} disabled={responding} className="w-full rounded-xl">
                  {responding ? "Enviando..." : "Enviar Resposta"}
                </Button>
              </div>
              {/* Real-time Chat */}
              <div className="border-t border-border pt-4">
                <ChatPanel
                  denunciaId={selectedDenuncia.id}
                  denunciaCodigo={selectedDenuncia.codigo_acompanhamento}
                  userId={userId}
                  senderName={userName}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
