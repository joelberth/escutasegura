import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Save, ArrowLeft, User, Mail, Phone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import DarkModeToggle from "@/components/DarkModeToggle";

const Perfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [gestor, setGestor] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin/login"); return; }
      setUser(user);

      const { data: adminRole } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!adminRole);

      const { data: gestorData } = await supabase
        .from("gestores")
        .select("*, escolas(nome, cidade, estado)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (gestorData) {
        setGestor(gestorData);
        setNome(gestorData.nome);
        setTelefone(gestorData.telefone || "");
      }

      const { data: files } = await supabase.storage.from("evidencias").list(`avatars/${user.id}`);
      if (files && files.length > 0) {
        const { data: urlData } = supabase.storage.from("evidencias").getPublicUrl(`avatars/${user.id}/${files[0].name}`);
        setAvatarUrl(urlData.publicUrl);
      }

      setLoading(false);
    };
    loadProfile();
  }, [navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Apenas imagens são aceitas", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}/avatar.${ext}`;

    const { data: oldFiles } = await supabase.storage.from("evidencias").list(`avatars/${user.id}`);
    if (oldFiles && oldFiles.length > 0) {
      await supabase.storage.from("evidencias").remove(oldFiles.map(f => `avatars/${user.id}/${f.name}`));
    }

    const { error } = await supabase.storage.from("evidencias").upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from("evidencias").getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl + "?t=" + Date.now());
      toast({ title: "Foto atualizada! 📸" });
    } else {
      toast({ title: "Erro ao enviar foto", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!gestor) return;
    setSaving(true);
    const { error } = await supabase.from("gestores").update({
      nome: nome.trim(),
      telefone: telefone.trim() || null,
    }).eq("id", gestor.id);

    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado! ✅" });
      setShowConfirm(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando perfil...</div>
          </main>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12 md:py-16">
          <div className="container max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-display font-bold">Meu Perfil</h1>
              <div className="ml-auto"><DarkModeToggle /></div>
            </div>

            {/* Avatar */}
            <div className="glass rounded-2xl p-8 mb-6 text-center">
              <div className="relative inline-block">
                <Avatar className="h-28 w-28 mx-auto border-4 border-background shadow-elevated">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl font-display font-bold bg-primary/10 text-primary">
                    {(nome || user?.email || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>
              <h2 className="text-xl font-display font-bold mt-4">{nome || user?.email}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isAdmin ? "👑 Administrador" : gestor ? `📋 ${gestor.tipo?.replace("_", " ")}` : "Usuário"}
              </p>
              {gestor?.escolas && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  🏫 {(gestor.escolas as any).nome} — {(gestor.escolas as any).cidade}/{(gestor.escolas as any).estado}
                </p>
              )}
            </div>

            {/* Info cards */}
            <div className="glass rounded-2xl p-6 space-y-5 mb-6">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Informações Pessoais
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> Nome Completo
                  </label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> E-mail
                  </label>
                  <Input value={user?.email || ""} disabled className="rounded-xl bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Telefone
                  </label>
                  <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(98) 9xxxx-xxxx" className="rounded-xl" />
                </div>
              </div>
            </div>

            {/* Role info */}
            <div className="glass rounded-2xl p-6 space-y-3 mb-6">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Status da Conta
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Função</p>
                  <p className="font-medium">{isAdmin ? "Administrador" : gestor ? "Gestor" : "Usuário"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{gestor?.approved ? "✅ Aprovado" : "⏳ Pendente"}</p>
                </div>
                {gestor && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Tipo</p>
                      <p className="font-medium capitalize">{gestor.tipo?.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Desde</p>
                      <p className="font-medium">{new Date(gestor.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {gestor && (
              <Button onClick={() => setShowConfirm(true)} className="w-full gap-2 rounded-xl" size="lg">
                <Save className="h-4 w-4" /> Salvar Alterações
              </Button>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Alterações</DialogTitle>
            <DialogDescription>
              Deseja salvar as alterações no seu perfil?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl">
              {saving ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default Perfil;
