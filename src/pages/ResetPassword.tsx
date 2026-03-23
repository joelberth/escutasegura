import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import PageTransition from "@/components/PageTransition";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      // Listen for auth state change from recovery link
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Erro ao redefinir senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha redefinida com sucesso! ✅" });
      navigate("/admin/login");
    }
    setLoading(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="w-full max-w-sm mx-auto px-4">
            <div className="text-center mb-8">
              <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold">Redefinir Senha</h1>
              <p className="text-sm text-muted-foreground mt-1">Digite sua nova senha abaixo</p>
            </div>

            {ready ? (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nova Senha</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmar Senha</label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="rounded-xl" />
                </div>
                <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                  {loading ? "Salvando..." : "Redefinir Senha"}
                </Button>
              </form>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>Verificando link de recuperação...</p>
                <p className="text-xs mt-2">Se você não recebeu o link, volte à página de login e solicite novamente.</p>
                <Button variant="outline" onClick={() => navigate("/admin/login")} className="mt-4 rounded-xl">
                  Voltar ao Login
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default ResetPassword;
