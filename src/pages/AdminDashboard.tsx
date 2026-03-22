import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, BarChart3, Settings, LogOut, Eye, MessageSquare, CheckCircle2,
  Download, Clock, AlertCircle, Filter, Building2, UserCheck, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import type { Tables } from "@/integrations/supabase/types";
import AdminEscolas from "@/pages/AdminEscolas";

type Denuncia = Tables<"denuncias">;

const statusLabels: Record<string, string> = { pendente: "Pendente", em_analise: "Em Análise", resolvida: "Resolvida" };
const tipoLabels: Record<string, string> = { bullying: "Bullying", estrutural: "Estrutural", comunicacao: "Comunicação", outro: "Outro" };
const urgenciaLabels: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta" };
const tipoGestorLabels: Record<string, string> = {
  geral: "Gestor Geral", administrativo: "Gestor Administrativo",
  financeiro: "Gestor Financeiro", administrativo_financeiro: "Gestor Adm. e Financeiro",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"denuncias" | "stats" | "escolas" | "aprovacoes" | "config">("denuncias");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEscola, setFilterEscola] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [gestorEscola, setGestorEscola] = useState<string | null>(null);
  const [escolas, setEscolas] = useState<{ id: string; nome: string }[]>([]);

  // Detail / respond dialog
  const [selectedDenuncia, setSelectedDenuncia] = useState<Denuncia | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);

  // Pending approvals
  const [pendingGestores, setPendingGestores] = useState<any[]>([]);

  const fetchDenuncias = async (escolaFilter?: string | null) => {
    let query = supabase.from("denuncias").select("*").order("created_at", { ascending: false });
    if (escolaFilter) {
      query = query.eq("escola", escolaFilter);
    }
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

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { navigate("/admin/login"); return; }

      const { data: adminRole } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });

      if (adminRole) {
        setIsAdmin(true);
        fetchDenuncias();
        fetchEscolas();
        fetchPendingGestores();
      } else {
        // Check if approved gestor
        const { data: gestorData } = await supabase
          .from("gestores")
          .select("escola_id, approved, escolas(nome)")
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
        fetchDenuncias(escolaNome);
        fetchEscolas();
      }
    });

    const channel = supabase.channel("denuncias-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "denuncias" }, () => {
        if (gestorEscola) fetchDenuncias(gestorEscola);
        else fetchDenuncias();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

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
      `${d.codigo_acompanhamento},${d.tipo},${d.escola},${d.urgencia},${d.status},${new Date(d.created_at).toLocaleDateString("pt-BR")},"${d.descricao.replace(/"/g, '""')}"`
    );
    const csv = [...headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `denuncias-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Stats
  const today = new Date().toDateString();
  const totalToday = denuncias.filter((d) => new Date(d.created_at).toDateString() === today).length;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const resolvedThisWeek = denuncias.filter((d) => d.status === "resolvida" && d.resolved_at && new Date(d.resolved_at) >= weekAgo).length;
  const totalResolved = denuncias.filter((d) => d.status === "resolvida").length;
  const satisfaction = denuncias.length > 0 ? Math.round((totalResolved / denuncias.length) * 100) : 0;

  const chartData = Object.entries(tipoLabels).map(([key, label]) => ({
    name: label,
    total: denuncias.filter((d) => d.tipo === key).length,
  }));

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

  // Unique escola names for filter
  const escolaNames = [...new Set(denuncias.map((d) => d.escola))].sort();

  const sidebarItems = [
    { key: "denuncias" as const, label: "Denúncias", icon: Shield },
    ...(isAdmin ? [{ key: "escolas" as const, label: "Escolas", icon: Building2 }] : []),
    ...(isAdmin ? [{ key: "aprovacoes" as const, label: "Aprovações", icon: UserCheck }] : []),
    { key: "stats" as const, label: "Estatísticas", icon: BarChart3 },
    ...(isAdmin ? [{ key: "config" as const, label: "Configurações", icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 p-5 border-b border-sidebar-border">
          <Shield className="h-6 w-6 text-sidebar-primary" />
          <span className="font-display font-bold">Escola Segura</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.key ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="h-4 w-4" /> {item.label}
              {item.key === "aprovacoes" && pendingGestores.length > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingGestores.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground px-3 mb-2">
            {isAdmin ? "Admin" : gestorEscola ? `Gestor — ${gestorEscola}` : ""}
          </p>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-sidebar-accent/50 transition-colors">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 font-display font-bold">
            <Shield className="h-5 w-5 text-primary" /> Painel
          </div>
          <div className="flex gap-2">
            {sidebarItems.map((item) => (
              <button key={item.key} onClick={() => setActiveTab(item.key)} className={`p-2 rounded-lg ${activeTab === item.key ? "bg-accent" : ""}`}>
                <item.icon className="h-4 w-4" />
              </button>
            ))}
            <button onClick={handleLogout} className="p-2"><LogOut className="h-4 w-4" /></button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {/* Stats Tab */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-display font-bold">Estatísticas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-3xl font-display font-bold mt-1">{denuncias.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <p className="text-sm text-muted-foreground">Hoje</p>
                  <p className="text-3xl font-display font-bold mt-1">{totalToday}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <p className="text-sm text-muted-foreground">Resolvidas (semana)</p>
                  <p className="text-3xl font-display font-bold mt-1">{resolvedThisWeek}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <p className="text-sm text-muted-foreground">Taxa resolução</p>
                  <p className="text-3xl font-display font-bold mt-1">{satisfaction}%</p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="font-display font-semibold mb-4">Denúncias por Tipo</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(142, 73%, 28%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="font-display font-semibold mb-4">Timeline — Últimos 30 dias</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="total" stroke="hsl(142, 73%, 28%)" fill="hsl(142, 73%, 28%)" fillOpacity={0.15} name="Novas" />
                    <Area type="monotone" dataKey="resolvidas" stroke="hsl(226, 72%, 40%)" fill="hsl(226, 72%, 40%)" fillOpacity={0.1} name="Resolvidas" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Escolas Tab (admin only) */}
          {activeTab === "escolas" && isAdmin && <AdminEscolas />}

          {/* Aprovações Tab (admin only) */}
          {activeTab === "aprovacoes" && isAdmin && (
            <div className="space-y-6">
              <h2 className="text-2xl font-display font-bold">Aprovações de Gestores</h2>
              {pendingGestores.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Nenhum cadastro pendente de aprovação.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingGestores.map((g) => (
                    <div key={g.id} className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{g.nome}</p>
                        <p className="text-sm text-muted-foreground">{g.email} • {tipoGestorLabels[g.tipo]}</p>
                        <p className="text-sm text-muted-foreground">Escola: {(g.escolas as any)?.nome || "—"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproveGestor(g)} className="gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectGestor(g)} className="gap-1 text-destructive">
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Config Tab */}
          {activeTab === "config" && isAdmin && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-2xl font-display font-bold">Configurações</h2>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configurações avançadas estarão disponíveis em breve. Entre em contato pelo WhatsApp para suporte.
                </p>
              </div>
            </div>
          )}

          {/* Denúncias Tab */}
          {activeTab === "denuncias" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-display font-bold">
                  Denúncias {gestorEscola && <span className="text-base font-normal text-muted-foreground">— {gestorEscola}</span>}
                </h2>
                <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
                  <Download className="h-4 w-4" /> Exportar CSV
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterTipo} onValueChange={setFilterTipo}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {Object.entries(tipoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                {isAdmin && (
                  <Select value={filterEscola} onValueChange={setFilterEscola}>
                    <SelectTrigger className="w-56"><SelectValue placeholder="Escola" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as escolas</SelectItem>
                      {escolaNames.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Buscar escola ou código..."
                  className="sm:max-w-xs"
                />
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma denúncia encontrada.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">Código</th>
                          <th className="text-left px-4 py-3 font-medium">Tipo</th>
                          <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Escola</th>
                          <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Data</th>
                          <th className="text-left px-4 py-3 font-medium">Status</th>
                          <th className="text-right px-4 py-3 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filtered.map((d) => (
                          <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs">{d.codigo_acompanhamento}</td>
                            <td className="px-4 py-3">{tipoLabels[d.tipo]}</td>
                            <td className="px-4 py-3 hidden md:table-cell max-w-[200px] truncate">{d.escola}</td>
                            <td className="px-4 py-3 hidden sm:table-cell">{new Date(d.created_at).toLocaleDateString("pt-BR")}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                d.status === "pendente" ? "text-urgency-medium bg-urgency-medium/10" :
                                d.status === "em_analise" ? "text-secondary bg-secondary/10" :
                                "text-primary bg-accent"
                              }`}>
                                {d.status === "pendente" && <Clock className="h-3 w-3" />}
                                {d.status === "em_analise" && <AlertCircle className="h-3 w-3" />}
                                {d.status === "resolvida" && <CheckCircle2 className="h-3 w-3" />}
                                {statusLabels[d.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedDenuncia(d); setResponseText(d.response_text || ""); }}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {d.status !== "resolvida" && (
                                  <Button variant="ghost" size="sm" onClick={() => handleResolve(d.id)}>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                <p className="text-sm bg-muted rounded-lg p-3">{selectedDenuncia.descricao}</p>
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
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Escreva uma resposta para o denunciante..."
                  rows={3}
                />
                <Button onClick={handleRespond} disabled={responding} className="w-full">
                  {responding ? "Enviando..." : "Enviar Resposta"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
