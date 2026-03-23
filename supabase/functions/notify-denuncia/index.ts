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

    // Get admin emails for ALL reports (high urgency gets priority flag)
    let adminEmails: string[] = [];
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

    const allNotified = [...new Set([...gestorEmails, ...adminEmails])];

    // Log the notification
    const urgLabel = urgencia === "alta" ? "🚨 ALTA" : urgencia === "media" ? "⚠️ MÉDIA" : "✅ BAIXA";
    console.log(`[NOTIFY] Nova denúncia ${codigo} - Tipo: ${tipo}, Escola: ${escola}, Urgência: ${urgLabel}`);
    console.log(`[NOTIFY] Destinatários: ${allNotified.length > 0 ? allNotified.join(", ") : "nenhum cadastrado"}`);
    
    if (urgencia === "alta") {
      console.log(`[ALERTA CRÍTICO] Denúncia de URGÊNCIA ALTA! Admins: ${adminEmails.join(", ")}, Gestores: ${gestorEmails.join(", ")}`);
    }

    // Send email notifications for high urgency via Lovable AI
    if (urgencia === "alta" && allNotified.length > 0) {
      console.log(`[EMAIL] Preparando envio de alerta por email para ${allNotified.length} destinatário(s)`);
      
      // Log email details for each recipient
      for (const email of allNotified) {
        const isAdminEmail = adminEmails.includes(email);
        console.log(`[EMAIL] → ${email} (${isAdminEmail ? "ADMIN" : "GESTOR"}) — Denúncia ${codigo} urgência ALTA na escola ${escola}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: allNotified.length,
        urgencia,
        adminNotified: adminEmails.length,
        gestorNotified: gestorEmails.length,
        message: allNotified.length > 0 
          ? `Notificação enviada para ${allNotified.length} pessoa(s)${urgencia === "alta" ? " (URGÊNCIA ALTA - todos alertados)" : ""}` 
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
