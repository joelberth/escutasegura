import { useEffect, useState } from "react";
import { Users, Search, CheckCircle2, XCircle, UserCog, Shield, Building2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const tipoGestorLabels: Record<string, string> = {
  geral: "Gestor Geral", administrativo: "Gestor Administrativo",
  financeiro: "Gestor Financeiro", administrativo_financeiro: "Gestor Adm. e Financeiro",
};

const AdminUsuarios = () => {
  const { toast } = useToast();
  const [gestores, setGestores] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchData = async () => {
    setLoading(true);
    const [gestoresRes, rolesRes] = await Promise.all([
      supabase.from("gestores").select("*, escolas(nome, cidade, estado)").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);
    if (gestoresRes.data) setGestores(gestoresRes.data);
    if (rolesRes.data) setRoles(rolesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = gestores.filter((g) => {
    if (filterStatus === "approved" && !g.approved) return false;
    if (filterStatus === "pending" && g.approved) return false;
    if (search) {
      const s = search.toLowerCase();
      return g.nome.toLowerCase().includes(s) || g.email.toLowerCase().includes(s);
    }
    return true;
  });

  const handleApprove = async (g: any) => {
    await supabase.from("gestores").update({ approved: true }).eq("id", g.id);
    if (g.user_id) {
      await supabase.from("user_roles").insert({ user_id: g.user_id, role: "user" as const }).select();
    }
    toast({ title: `${g.nome} aprovado ✅` });
    fetchData();
  };

  const handleRevoke = async (g: any) => {
    await supabase.from("gestores").update({ approved: false }).eq("id", g.id);
    toast({ title: `Acesso de ${g.nome} revogado` });
    fetchData();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await supabase.from("gestores").delete().eq("id", confirmDelete.id);
    toast({ title: "Gestor removido" });
    setConfirmDelete(null);
    fetchData();
  };

  const adminUserIds = roles.filter(r => r.role === "admin").map(r => r.user_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Gerenciar Usuários
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="sm:w-64 rounded-xl"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Gestores", value: gestores.length, icon: Users },
          { label: "Aprovados", value: gestores.filter(g => g.approved).length, icon: CheckCircle2 },
          { label: "Pendentes", value: gestores.filter(g => !g.approved).length, icon: XCircle },
          { label: "Administradores", value: adminUserIds.length, icon: Shield },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl glass p-4 shadow-card text-center">
            <s.icon className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-display font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((g, i) => {
            const isAdminUser = adminUserIds.includes(g.user_id);
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="rounded-2xl glass p-5 shadow-card hover:shadow-elevated transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{g.nome}</p>
                      {isAdminUser && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">👑 Admin</span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        g.approved ? "bg-primary/10 text-primary" : "bg-urgency-medium/10 text-urgency-medium"
                      }`}>
                        {g.approved ? "✅ Aprovado" : "⏳ Pendente"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{g.email}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UserCog className="h-3 w-3" /> {tipoGestorLabels[g.tipo] || g.tipo}
                      </span>
                      {g.escolas && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {(g.escolas as any).nome}
                        </span>
                      )}
                      <span>{new Date(g.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!g.approved ? (
                      <Button size="sm" onClick={() => handleApprove(g)} className="gap-1 rounded-xl text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleRevoke(g)} className="gap-1 rounded-xl text-xs">
                        <XCircle className="h-3.5 w-3.5" /> Revogar
                      </Button>
                    )}
                    {!isAdminUser && (
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(g)} className="rounded-xl text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirm delete dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{confirmDelete?.nome}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} className="rounded-xl">Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">Remover</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsuarios;
