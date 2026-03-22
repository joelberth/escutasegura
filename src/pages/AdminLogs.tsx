import { useEffect, useState } from "react";
import { Shield, Monitor, MapPin, Globe, RefreshCw, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Denuncia = Tables<"denuncias">;

const tipoLabels: Record<string, string> = {
  bullying: "Bullying", estrutural: "Estrutural", comunicacao: "Comunicação", outro: "Outro",
};
const urgenciaLabels: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta" };

const AdminLogs = () => {
  const [logs, setLogs] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("denuncias")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setLogs(data);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.codigo_acompanhamento.toLowerCase().includes(s) ||
      l.escola.toLowerCase().includes(s) ||
      (l.ip_address || "").toLowerCase().includes(s)
    );
  });

  const exportPDF = () => {
    // Generate a printable HTML and open in new window for PDF save
    const rows = filtered.map((log) => `
      <tr>
        <td>${log.codigo_acompanhamento}</td>
        <td>${new Date(log.created_at).toLocaleString("pt-BR")}</td>
        <td>${tipoLabels[log.tipo] || log.tipo}</td>
        <td>${urgenciaLabels[log.urgencia] || log.urgencia}</td>
        <td>${log.escola}</td>
        <td>${log.ip_address || "N/D"}</td>
        <td>${log.device_info || "N/D"}</td>
        <td>${log.location_info || "N/D"}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Logs - Escola Segura Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      p { color: #666; margin-bottom: 16px; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #f5f5f5; font-weight: 600; }
      tr:nth-child(even) { background: #fafafa; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <h1>📋 Relatório de Logs — Escola Segura Report</h1>
    <p>Gerado em ${new Date().toLocaleString("pt-BR")} • Total: ${filtered.length} registros</p>
    <table>
      <thead><tr>
        <th>Código</th><th>Data/Hora</th><th>Tipo</th><th>Urgência</th><th>Escola</th><th>IP</th><th>Dispositivo</th><th>Localização</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <script>window.print();</script>
    </body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-display font-bold">Logs de Denúncias</h2>
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar código, escola, IP..."
            className="sm:w-64"
          />
          <Button variant="outline" size="icon" onClick={fetchLogs} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5">
            <FileDown className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum log encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <div key={log.id} className="rounded-xl glass p-4 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-mono text-xs font-medium bg-muted px-2 py-0.5 rounded">
                      {log.codigo_acompanhamento}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      log.urgencia === "alta" ? "bg-destructive/10 text-destructive" :
                      log.urgencia === "media" ? "bg-urgency-medium/10 text-urgency-medium" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {tipoLabels[log.tipo]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      log.urgencia === "alta" ? "bg-destructive/10 text-destructive" :
                      log.urgencia === "media" ? "bg-urgency-medium/10 text-urgency-medium" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {urgenciaLabels[log.urgencia]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 truncate max-w-xl">{log.escola}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      IP: {log.ip_address || "Não disponível"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Monitor className="h-3.5 w-3.5" />
                      {log.device_info || "Não disponível"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {log.location_info || "Não disponível"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
