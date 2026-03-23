import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Camera, KeyRound, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { supabase } from "@/integrations/supabase/client";

const ProfileButton = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nome, setNome] = useState<string>("");
  const [role, setRole] = useState<string>("Usuário");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUser(user);

      // Get avatar
      const { data: files } = await supabase.storage.from("evidencias").list(`avatars/${user.id}`);
      if (files && files.length > 0) {
        const { data } = supabase.storage.from("evidencias").getPublicUrl(`avatars/${user.id}/${files[0].name}`);
        setAvatarUrl(data.publicUrl);
      }

      // Get role
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (isAdmin) {
        setRole("Administrador");
        setNome("Admin");
      } else {
        const { data: gestor } = await supabase
          .from("gestores")
          .select("nome, tipo")
          .eq("user_id", user.id)
          .maybeSingle();
        if (gestor) {
          setNome(gestor.nome);
          setRole(gestor.tipo?.replace("_", " ") || "Gestor");
        }
      }
    });
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const menuItems = [
    { icon: User, label: "Meu Perfil", onClick: () => navigate("/perfil") },
    { icon: Camera, label: "Trocar Foto", onClick: () => navigate("/perfil") },
    { icon: KeyRound, label: "Trocar Senha", onClick: async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (!error) alert("Link de redefinição enviado para " + user.email);
    }},
    { icon: LogOut, label: "Sair", onClick: handleLogout, danger: true },
  ];

  return (
    <HoverCard openDelay={100} closeDelay={200}>
      <HoverCardTrigger asChild>
        <button
          onClick={() => navigate("/perfil")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          title="Meu perfil"
        >
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              <User className="h-3.5 w-3.5" />
            </AvatarFallback>
          </Avatar>
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-64 p-0" align="end" sideOffset={8}>
        {/* Profile header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-sm bg-primary/10 text-primary font-bold">
                {(nome || user?.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{nome || user?.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium mt-0.5 capitalize">
                {role}
              </span>
            </div>
          </div>
        </div>
        {/* Menu items */}
        <div className="p-1.5">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                item.danger
                  ? "text-destructive hover:bg-destructive/10"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default ProfileButton;
