import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const ProfileButton = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUser(user);
      const { data: files } = await supabase.storage.from("evidencias").list(`avatars/${user.id}`);
      if (files && files.length > 0) {
        const { data } = supabase.storage.from("evidencias").getPublicUrl(`avatars/${user.id}/${files[0].name}`);
        setAvatarUrl(data.publicUrl);
      }
    });
  }, []);

  if (!user) return null;

  return (
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
  );
};

export default ProfileButton;
