import { useState } from "react";
import { Shield, LogIn, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Erro de autenticação", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: roleData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (roleData) {
      toast({ title: "Bem-vindo(a), Admin! ✅" });
      navigate("/admin");
      setLoading(false);
      return;
    }

    const { data: gestorData } = await supabase
      .from("gestores")
      .select("approved")
      .eq("user_id", user.id)
      .eq("approved", true)
      .maybeSingle();

    if (gestorData) {
      toast({ title: "Bem-vindo(a), Gestor! ✅" });
      navigate("/admin");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    toast({ title: "Acesso negado", description: "Sua conta ainda não foi aprovada pelo administrador.", variant: "destructive" });
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Link enviado! 📧", description: "Verifique seu e-mail para redefinir a senha." });
      setShowReset(false);
      setResetEmail("");
    }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="w-full max-w-sm mx-auto px-4">
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold">Área do Gestor</h1>
            <p className="text-sm text-muted-foreground mt-1">Faça login para acessar o painel administrativo</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 animate-fade-in-up-delay-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="gestor@escola.com" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Senha</label>
                <button
                  type="button"
                  onClick={() => { setShowReset(true); setResetEmail(email); }}
                  className="text-xs text-primary hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? "Entrando..." : <><LogIn className="h-4 w-4" /> Entrar</>}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              É gestor e não tem conta?{" "}
              <button type="button" onClick={() => navigate("/gestor/registro")} className="text-primary underline">
                Cadastre-se aqui
              </button>
            </p>
          </form>
        </div>
      </main>

      {/* Password Reset Dialog */}
      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Recuperar Senha
            </DialogTitle>
            <DialogDescription>
              Informe seu e-mail para receber o link de redefinição de senha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="seu@email.com"
              className="rounded-xl"
            />
            <Button onClick={handleResetPassword} disabled={resetLoading} className="w-full rounded-xl">
              {resetLoading ? "Enviando..." : "Enviar Link de Recuperação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLogin;
