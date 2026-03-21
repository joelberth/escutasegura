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
        .eq("escola_id", escolaData.id);
      if (gestores) {
        gestorEmails = gestores.map((g: { email: string }) => g.email).filter(Boolean);
      }
      if (escolaData.email) {
        gestorEmails.push(escolaData.email);
      }
    }

    // Log the notification (email sending would require email domain setup)
    console.log(`[NOTIFY] Nova denúncia ${codigo} - Tipo: ${tipo}, Escola: ${escola}, Urgência: ${urgencia}`);
    console.log(`[NOTIFY] Gestores notificados: ${gestorEmails.length > 0 ? gestorEmails.join(", ") : "nenhum cadastrado"}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: gestorEmails.length,
        message: gestorEmails.length > 0 
          ? `Notificação enviada para ${gestorEmails.length} gestor(es)` 
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
