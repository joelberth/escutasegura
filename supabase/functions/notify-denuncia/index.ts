import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codigo, tipo, escola, urgencia } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get gestores for the school
    const { data: escolaData } = await supabase
      .from("escolas")
      .select("id, email")
      .eq("nome", escola)
      .maybeSingle();

    // Get gestores if school exists
    let gestorEmails: string[] = [];
    if (escolaData?.id) {
      const { data: gestores } = await supabase
        .from("gestores")
        .select("email")
        .eq("escola_id", escolaData.id)
        .eq("approved", true);
      if (gestores) {
        gestorEmails = gestores.map((g: { email: string }) => g.email).filter(Boolean);
      }
      if (escolaData.email) {
        gestorEmails.push(escolaData.email);
      }
    }

    // Get admin emails for high urgency
    let adminEmails: string[] = [];
    if (urgencia === "alta") {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      
      if (adminRoles && adminRoles.length > 0) {
        for (const role of adminRoles) {
          const { data: userData } = await supabase.auth.admin.getUserById(role.user_id);
          if (userData?.user?.email) {
            adminEmails.push(userData.user.email);
          }
        }
      }
    }

    const allNotified = [...new Set([...gestorEmails, ...adminEmails])];

    // Log the notification
    const urgLabel = urgencia === "alta" ? "🚨 ALTA" : urgencia === "media" ? "⚠️ MÉDIA" : "✅ BAIXA";
    console.log(`[NOTIFY] Nova denúncia ${codigo} - Tipo: ${tipo}, Escola: ${escola}, Urgência: ${urgLabel}`);
    console.log(`[NOTIFY] Destinatários: ${allNotified.length > 0 ? allNotified.join(", ") : "nenhum cadastrado"}`);
    
    if (urgencia === "alta") {
      console.log(`[ALERTA] Denúncia de URGÊNCIA ALTA detectada! Admins notificados: ${adminEmails.join(", ")}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: allNotified.length,
        urgencia,
        message: allNotified.length > 0 
          ? `Notificação enviada para ${allNotified.length} pessoa(s)${urgencia === "alta" ? " (URGÊNCIA ALTA - admins incluídos)" : ""}` 
          : "Nenhum gestor cadastrado para esta escola"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na notificação:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar notificação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
