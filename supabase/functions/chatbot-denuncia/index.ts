import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o assistente virtual do Escola Segura Report, uma plataforma anônima de denúncias escolares alinhada ao ODS 16 da ONU.

Seu papel é ORIENTAR o usuário antes de fazer uma denúncia. Responda de forma curta, empática e em português brasileiro.

O que pode ser denunciado:
- Bullying e assédio (físico, verbal, cyberbullying)
- Problemas estruturais (infraestrutura precária, falta de acessibilidade)
- Comunicação com a gestão (falta de transparência, negligência)
- Outros problemas que afetem a segurança escolar

Informações importantes:
- A denúncia é 100% ANÔNIMA - nenhum dado pessoal é coletado
- Um código de acompanhamento é gerado para rastrear o status
- Urgência alta: situações de risco iminente (violência, abuso)
- Urgência média: problemas recorrentes que precisam atenção
- Urgência baixa: sugestões de melhoria ou problemas pontuais
- Podem ser anexadas até 3 evidências (fotos, PDFs, até 10MB cada)

Se o usuário descrever uma situação, ajude a classificar o tipo e urgência. Não peça dados pessoais. Seja breve (max 3 frases).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Desculpe, não consegui responder.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chatbot error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
