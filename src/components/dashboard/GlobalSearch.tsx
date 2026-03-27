import { useState, useEffect, useCallback, useRef } from "react";
import { Search, FileText, Building2, Calendar } from "lucide-react";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Tables } from "@/integrations/supabase/types";

type Denuncia = Tables<"denuncias">;

interface GlobalSearchProps {
  denuncias: Denuncia[];
  onSelect: (denuncia: Denuncia) => void;
  onNavigate?: (tab: string) => void;
}

const tipoLabels: Record<string, string> = {
  bullying: "Bullying", estrutural: "Estrutural", comunicacao: "Comunicação", outro: "Outro",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente", em_analise: "Em Análise", resolvida: "Resolvida",
};

const GlobalSearch = ({ denuncias, onSelect, onNavigate }: GlobalSearchProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
    else setQuery("");
  }, [open]);

  const results = query.length >= 2
    ? denuncias.filter(d => {
        const q = query.toLowerCase();
        return (
          d.codigo_acompanhamento.toLowerCase().includes(q) ||
          d.escola.toLowerCase().includes(q) ||
          d.descricao.toLowerCase().includes(q) ||
          (tipoLabels[d.tipo] || "").toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  const quickActions = [
    { label: "Ver Estatísticas", icon: FileText, tab: "stats" },
    { label: "Ver Escolas", icon: Building2, tab: "escolas" },
    { label: "Ver Agendamentos", icon: Calendar, tab: "agendamentos" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar denúncias, escolas, códigos..."
            className="border-0 shadow-none focus-visible:ring-0 h-12 text-sm"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-3 space-y-1">
              <p className="text-xs text-muted-foreground px-2 py-1">Ações rápidas</p>
              {quickActions.map(a => (
                <button
                  key={a.tab}
                  onClick={() => { onNavigate?.(a.tab); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors text-left"
                >
                  <a.icon className="h-4 w-4 text-muted-foreground" />
                  {a.label}
                </button>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum resultado para "{query}"
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {results.map(d => (
                <button
                  key={d.id}
                  onClick={() => { onSelect(d); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    d.urgencia === "alta" ? "bg-destructive/15 text-destructive" :
                    d.status === "resolvida" ? "bg-primary/15 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{d.codigo_acompanhamento}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        d.status === "resolvida" ? "bg-primary/15 text-primary" :
                        d.status === "em_analise" ? "bg-secondary/15 text-secondary" :
                        "bg-urgency-medium/15 text-urgency-medium"
                      }`}>
                        {statusLabels[d.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{d.escola}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(d.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>↑↓ navegar • Enter selecionar</span>
          <span>
            <kbd className="px-1 py-0.5 rounded border border-border bg-muted">Ctrl</kbd>
            +
            <kbd className="px-1 py-0.5 rounded border border-border bg-muted">K</kbd>
            para abrir
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
