import { useState, useEffect, useMemo } from "react";
import { Shield, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

const tipoGestorLabels: Record<string, string> = {
  geral: "Gestor Geral",
  administrativo: "Gestor Administrativo",
  financeiro: "Gestor Financeiro",
  administrativo_financeiro: "Gestor Adm. e Financeiro",
};

type Escola = { id: string; nome: string; cidade: string; estado: string };

const GestorRegistro = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [escolaId, setEscolaId] = useState("");
  const [tipo, setTipo] = useState<string>("geral");
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.from("escolas").select("id, nome, cidade, estado").order("nome").then(({ data }) => {
      if (data) setEscolas(data);
    });
  }, []);

  const estados = useMemo(() => [...new Set(escolas.map((e) => e.estado))].sort(), [escolas]);
  const municipios = useMemo(() => {
    if (!estado) return [];
    return [...new Set(escolas.filter((e) => e.estado === estado).map((e) => e.cidade))].sort();
  }, [escolas, estado]);
  const filteredEscolas = useMemo(() => {
    return escolas.filter((e) => {
      if (estado && e.estado !== estado) return false;
      if (municipio && e.cidade !== municipio) return false;
      return true;
    });
  }, [escolas, estado, municipio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !password || !escolaId) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar conta");

      const { error: gestorError } = await supabase.from("gestores").insert({
        user_id: authData.user.id,
        escola_id: escolaId,
        nome,
        email,
        telefone: telefone || null,
        tipo: tipo as "geral" | "administrativo" | "financeiro" | "administrativo_financeiro",
        approved: false,
      });
      if (gestorError) throw gestorError;

      await supabase.auth.signOut();
      setSuccess(true);
    } catch (err: any) {
      toast({ title: "Erro ao criar conta", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center py-16">
            <div className="container max-w-md text-center animate-fade-in-up">
              <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
                <UserPlus className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-bold mb-3">Cadastro Enviado!</h1>
              <p className="text-muted-foreground mb-6">
                Seu cadastro foi recebido e está aguardando aprovação do administrador. 
                Você receberá acesso ao painel assim que for aprovado.
              </p>
              <Button onClick={() => navigate("/admin/login")} className="w-full">
                Ir para Login
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12 md:py-16">
          <div className="container max-w-lg">
            <div className="text-center mb-10 animate-fade-in-up">
              <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold">Cadastro de Gestor</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Cadastre-se para acessar o painel da sua escola. Após aprovação do admin, você terá acesso.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up-delay-1">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Completo *</label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail Institucional *</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="gestor@escola.edu.br" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha *</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(98) 9xxxx-xxxx" />
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado *</label>
                <Select value={estado} onValueChange={(v) => { setEstado(v); setMunicipio(""); setEscolaId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o estado..." /></SelectTrigger>
                  <SelectContent>
                    {estados.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Município */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Município *</label>
                <Select value={municipio} onValueChange={(v) => { setMunicipio(v); setEscolaId(""); }} disabled={!estado}>
                  <SelectTrigger><SelectValue placeholder={estado ? "Selecione o município..." : "Selecione o estado primeiro"} /></SelectTrigger>
                  <SelectContent>
                    {municipios.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Escola */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Escola *</label>
                <Select value={escolaId} onValueChange={setEscolaId} disabled={!municipio}>
                  <SelectTrigger><SelectValue placeholder={municipio ? "Selecione a escola..." : "Selecione o município primeiro"} /></SelectTrigger>
                  <SelectContent>
                    {filteredEscolas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Gestor *</label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoGestorLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Cadastrando..." : <><UserPlus className="h-4 w-4" /> Solicitar Cadastro</>}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Já tem conta?{" "}
                <button type="button" onClick={() => navigate("/admin/login")} className="text-primary underline">
                  Fazer login
                </button>
              </p>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default GestorRegistro;
