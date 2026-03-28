import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Plus, Trash2, Edit, Users, ArrowLeft, Save, X, Phone, Mail, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Escola = {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  endereco: string;
  telefone: string;
  email: string;
  tipo_instituicao: string;
};

type Gestor = {
  id: string;
  escola_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  tipo: "geral" | "administrativo" | "financeiro" | "administrativo_financeiro";
};

const tipoGestorLabels: Record<string, string> = {
  geral: "Gestor Geral",
  administrativo: "Gestor Administrativo",
  financeiro: "Gestor Financeiro",
  administrativo_financeiro: "Gestor Adm. e Financeiro",
};

const AdminEscolas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEscola, setEditingEscola] = useState<Escola | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // School form state
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("São Luís");
  const [estado, setEstado] = useState("MA");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [tipoInstituicao, setTipoInstituicao] = useState("pública");

  // Gestores
  const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null);
  const [gestores, setGestores] = useState<Gestor[]>([]);
  const [showGestorForm, setShowGestorForm] = useState(false);
  const [gestorNome, setGestorNome] = useState("");
  const [gestorEmail, setGestorEmail] = useState("");
  const [gestorTelefone, setGestorTelefone] = useState("");
  const [gestorTipo, setGestorTipo] = useState<Gestor["tipo"]>("geral");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { navigate("/admin/login"); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) { navigate("/admin/login"); return; }
      fetchEscolas();
    });
  }, [navigate]);

  const fetchEscolas = async () => {
    const { data } = await supabase.from("escolas").select("*").order("nome");
    if (data) setEscolas(data as Escola[]);
    setLoading(false);
  };

  const fetchGestores = async (escolaId: string) => {
    const { data } = await supabase.from("gestores").select("*").eq("escola_id", escolaId).order("tipo");
    if (data) setGestores(data as Gestor[]);
  };

  const resetForm = () => {
    setNome(""); setCidade("São Luís"); setEstado("MA");
    setEndereco(""); setTelefone(""); setEmail(""); setTipoInstituicao("pública");
    setEditingEscola(null);
  };

  const openEdit = (escola: Escola) => {
    setEditingEscola(escola);
    setNome(escola.nome); setCidade(escola.cidade); setEstado(escola.estado);
    setEndereco(escola.endereco || ""); setTelefone(escola.telefone || "");
    setEmail(escola.email || ""); setTipoInstituicao(escola.tipo_instituicao || "pública");
    setShowForm(true);
  };

  const handleSaveEscola = async () => {
    if (!nome.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }

    const payload = { nome, cidade, estado, endereco, telefone, email, tipo_instituicao: tipoInstituicao };

    if (editingEscola) {
      await supabase.from("escolas").update(payload).eq("id", editingEscola.id);
      toast({ title: "Escola atualizada ✅" });
    } else {
      await supabase.from("escolas").insert(payload);
      toast({ title: "Escola cadastrada ✅" });
    }

    setShowForm(false);
    resetForm();
    fetchEscolas();
  };

  const handleDeleteEscola = async (id: string) => {
    await supabase.from("escolas").delete().eq("id", id);
    toast({ title: "Escola removida" });
    fetchEscolas();
  };

  const handleAddGestor = async () => {
    if (!selectedEscola || !gestorNome.trim() || !gestorEmail.trim()) {
      toast({ title: "Preencha nome e e-mail", variant: "destructive" });
      return;
    }
    await supabase.from("gestores").insert({
      escola_id: selectedEscola.id,
      nome: gestorNome,
      email: gestorEmail,
      telefone: gestorTelefone || null,
      tipo: gestorTipo,
    });
    toast({ title: "Gestor cadastrado ✅" });
    setShowGestorForm(false);
    setGestorNome(""); setGestorEmail(""); setGestorTelefone(""); setGestorTipo("geral");
    fetchGestores(selectedEscola.id);
  };

  const handleDeleteGestor = async (id: string) => {
    if (!selectedEscola) return;
    await supabase.from("gestores").delete().eq("id", id);
    toast({ title: "Gestor removido" });
    fetchGestores(selectedEscola.id);
  };

  const openGestores = (escola: Escola) => {
    setSelectedEscola(escola);
    fetchGestores(escola.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Escolas & Gestores</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Escola
        </Button>
      </div>

      {/* School form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEscola ? "Editar Escola" : "Nova Escola"}</DialogTitle>
            <DialogDescription>Preencha os dados da escola</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome da Escola *</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="E.E.F.M. ..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Cidade</label>
                <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Estado</label>
                <Input value={estado} onChange={(e) => setEstado(e.target.value)} maxLength={2} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Endereço</label>
              <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Telefone</label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(85) 3xxx-xxxx" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">E-mail</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="escola@edu.ce.gov.br" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={tipoInstituicao} onValueChange={setTipoInstituicao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pública">Pública</SelectItem>
                  <SelectItem value="privada">Privada</SelectItem>
                  <SelectItem value="filantrópica">Filantrópica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveEscola} className="w-full gap-2">
              <Save className="h-4 w-4" /> {editingEscola ? "Salvar Alterações" : "Cadastrar Escola"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gestores dialog */}
      <Dialog open={!!selectedEscola} onOpenChange={() => setSelectedEscola(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gestores — {selectedEscola?.nome}</DialogTitle>
            <DialogDescription>Gerencie os gestores desta escola</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {gestores.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum gestor cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {gestores.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{g.nome}</p>
                      <p className="text-xs text-muted-foreground">{tipoGestorLabels[g.tipo]} • {g.email}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteGestor(g.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {showGestorForm ? (
              <div className="space-y-3 border-t border-border pt-4">
                <Input value={gestorNome} onChange={(e) => setGestorNome(e.target.value)} placeholder="Nome do gestor" />
                <Input value={gestorEmail} onChange={(e) => setGestorEmail(e.target.value)} placeholder="E-mail" />
                <Input value={gestorTelefone} onChange={(e) => setGestorTelefone(e.target.value)} placeholder="Telefone (opcional)" />
                <Select value={gestorTipo} onValueChange={(v) => setGestorTipo(v as Gestor["tipo"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoGestorLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={handleAddGestor} className="flex-1 gap-2">
                    <Save className="h-4 w-4" /> Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setShowGestorForm(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowGestorForm(true)} className="w-full gap-2">
                <Plus className="h-4 w-4" /> Adicionar Gestor
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Schools list */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
      ) : escolas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nenhuma escola cadastrada.</p>
        </div>
      ) : (() => {
        const totalPages = Math.ceil(escolas.length / itemsPerPage);
        const paginatedEscolas = escolas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        
        return (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Escola</th>
                    <th className="text-left px-4 py-3 font-medium">Cidade/UF</th>
                    <th className="text-left px-4 py-3 font-medium">Tipo</th>
                    <th className="text-right px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedEscolas.map((e) => (
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{e.nome}</td>
                      <td className="px-4 py-3">{e.cidade}/{e.estado}</td>
                      <td className="px-4 py-3 capitalize">{e.tipo_instituicao}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openGestores(e)} title="Gestores">
                            <Users className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(e)} title="Editar">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteEscola(e.id)} title="Excluir">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {paginatedEscolas.map((e) => (
                <div key={e.id} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-foreground leading-tight">{e.nome}</h3>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(e)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteEscola(e.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {e.cidade}/{e.estado}
                    </div>
                    <div className="flex items-center gap-1 capitalize">
                      <Building2 className="h-3 w-3" /> {e.tipo_instituicao}
                    </div>
                    {e.telefone && (
                      <div className="flex items-center gap-1 col-span-2">
                        <Phone className="h-3 w-3" /> {e.telefone}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={() => openGestores(e)}>
                    <Users className="h-3.5 w-3.5" /> Gerenciar Gestores
                  </Button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-2">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i} className="hidden sm:inline-block">
                        <PaginationLink
                          onClick={() => setCurrentPage(i + 1)}
                          isActive={currentPage === i + 1}
                          className="cursor-pointer"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default AdminEscolas;
