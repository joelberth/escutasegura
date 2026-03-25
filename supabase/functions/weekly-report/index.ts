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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get all approved gestores with their schools
    const { data: gestores } = await supabase
      .from("gestores")
      .select("id, nome, email, escola_id, escolas(nome)")
      .eq("approved", true);

    if (!gestores || gestores.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Nenhum gestor aprovado encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all denuncias from the last 7 days
    const { data: denuncias } = await supabase
      .from("denuncias")
      .select("*")
      .gte("created_at", weekAgo)
      .order("created_at", { ascending: false });

    const allDenuncias = denuncias || [];

    // Get resolved denuncias from the last 7 days
    const { data: resolvedDenuncias } = await supabase
      .from("denuncias")
      .select("*")
      .gte("resolved_at", weekAgo)
      .eq("status", "resolvida");

    const totalResolved = resolvedDenuncias?.length || 0;

    // Group denuncias by school
    const bySchool: Record<string, typeof allDenuncias> = {};
    for (const d of allDenuncias) {
      if (!bySchool[d.escola]) bySchool[d.escola] = [];
      bySchool[d.escola].push(d);
    }

    const tipoLabels: Record<string, string> = {
      bullying: "Bullying", estrutural: "Estrutural",
      comunicacao: "Comunicação", outro: "Outro",
    };
    const urgenciaLabels: Record<string, string> = {
      baixa: "Baixa", media: "Média", alta: "Alta",
    };

    const reports: { email: string; gestorNome: string; escolaNome: string; html: string }[] = [];

    for (const gestor of gestores) {
      const escolaNome = (gestor.escolas as any)?.nome || "Escola";
      const escolaDenuncias = bySchool[escolaNome] || [];
      const totalEscola = escolaDenuncias.length;
      const altaCount = escolaDenuncias.filter(d => d.urgencia === "alta").length;
      const pendentes = escolaDenuncias.filter(d => d.status === "pendente").length;
      const resolvidas = escolaDenuncias.filter(d => d.status === "resolvida").length;

      const tipoBreakdown = Object.entries(tipoLabels).map(([k, v]) => ({
        label: v,
        count: escolaDenuncias.filter(d => d.tipo === k).length,
      })).filter(t => t.count > 0);

      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8faf8;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#166534,#1a3a2a);border-radius:16px;padding:30px;text-align:center;color:#fff">
    <h1 style="margin:0 0 8px;font-size:22px">📊 Relatório Semanal</h1>
    <p style="margin:0;opacity:0.8;font-size:14px">Escola Segura Report — ${escolaNome}</p>
    <p style="margin:8px 0 0;opacity:0.6;font-size:12px">${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR")} a ${new Date().toLocaleDateString("pt-BR")}</p>
  </div>

  <p style="margin:20px 0 16px;font-size:15px;color:#333">Olá, <strong>${gestor.nome}</strong>!</p>
  <p style="margin:0 0 20px;font-size:14px;color:#666">Aqui está o resumo semanal de denúncias da sua escola:</p>

  <div style="display:flex;gap:12px;margin-bottom:20px">
    <div style="flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:bold;color:#166534">${totalEscola}</div>
      <div style="font-size:12px;color:#666;margin-top:4px">Novas Denúncias</div>
    </div>
    <div style="flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:bold;color:#dc2626">${altaCount}</div>
      <div style="font-size:12px;color:#666;margin-top:4px">Urgência Alta</div>
    </div>
    <div style="flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:bold;color:#ea580c">${pendentes}</div>
      <div style="font-size:12px;color:#666;margin-top:4px">Pendentes</div>
    </div>
    <div style="flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:bold;color:#1e40af">${resolvidas}</div>
      <div style="font-size:12px;color:#666;margin-top:4px">Resolvidas</div>
    </div>
  </div>

  ${tipoBreakdown.length > 0 ? `
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:20px">
    <h3 style="margin:0 0 12px;font-size:14px;color:#333">Por Tipo</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr style="border-bottom:1px solid #f3f4f6"><th style="text-align:left;padding:6px 0;color:#666">Tipo</th><th style="text-align:right;padding:6px 0;color:#666">Qtd</th></tr>
      ${tipoBreakdown.map(t => `<tr style="border-bottom:1px solid #f3f4f6"><td style="padding:6px 0">${t.label}</td><td style="text-align:right;padding:6px 0;font-weight:bold">${t.count}</td></tr>`).join("")}
    </table>
  </div>` : ""}

  ${escolaDenuncias.length > 0 ? `
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:20px">
    <h3 style="margin:0 0 12px;font-size:14px;color:#333">Últimas Denúncias</h3>
    ${escolaDenuncias.slice(0, 5).map(d => `
    <div style="padding:10px 0;border-bottom:1px solid #f3f4f6">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-family:monospace;font-size:12px;background:#f3f4f6;padding:2px 8px;border-radius:6px">${d.codigo_acompanhamento}</span>
        <span style="font-size:11px;padding:2px 8px;border-radius:20px;${d.urgencia === "alta" ? "background:#fef2f2;color:#dc2626" : d.urgencia === "media" ? "background:#fffbeb;color:#d97706" : "background:#f0fdf4;color:#16a34a"}">${urgenciaLabels[d.urgencia]}</span>
      </div>
      <p style="margin:4px 0 0;font-size:13px;color:#333">${tipoLabels[d.tipo] || d.tipo} — ${new Date(d.created_at).toLocaleDateString("pt-BR")}</p>
    </div>`).join("")}
  </div>` : `
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">
    <p style="margin:0;font-size:14px;color:#166534">✅ Nenhuma denúncia registrada nesta semana!</p>
  </div>`}

  <div style="text-align:center;margin-top:20px">
    <p style="font-size:12px;color:#999">Este relatório é gerado automaticamente pelo Escola Segura Report</p>
  </div>
</div>
</body>
</html>`;

      reports.push({ email: gestor.email, gestorNome: gestor.nome, escolaNome, html });
    }

    // Also send a global summary to admins
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    let adminReportsSent = 0;
    if (adminRoles && adminRoles.length > 0) {
      const totalGlobal = allDenuncias.length;
      const altaGlobal = allDenuncias.filter(d => d.urgencia === "alta").length;
      const pendentesGlobal = allDenuncias.filter(d => d.status === "pendente").length;
      const schoolCount = Object.keys(bySchool).length;

      for (const role of adminRoles) {
        const { data: userData } = await supabase.auth.admin.getUserById(role.user_id);
        if (userData?.user?.email) {
          console.log(`[WEEKLY] Admin report → ${userData.user.email}: ${totalGlobal} denúncias, ${schoolCount} escolas, ${altaGlobal} urgentes, ${pendentesGlobal} pendentes`);
          adminReportsSent++;
        }
      }
    }

    console.log(`[WEEKLY] Relatórios gerados: ${reports.length} gestores, ${adminReportsSent} admins`);
    for (const r of reports) {
      console.log(`[WEEKLY] → ${r.email} (${r.gestorNome}) — ${r.escolaNome}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        gestorReports: reports.length,
        adminReports: adminReportsSent,
        totalDenunciasWeek: allDenuncias.length,
        totalResolvedWeek: totalResolved,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no relatório semanal:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao gerar relatório semanal" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
