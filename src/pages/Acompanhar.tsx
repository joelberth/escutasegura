import { useState } from "react";
import { Search, Clock, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const statusConfig = {
  pendente: { label: "Pendente", icon: Clock, className: "text-urgency-medium bg-urgency-medium/10" },
  em_analise: { label: "Em Análise", icon: AlertCircle, className: "text-secondary bg-secondary/10" },
  resolvida: { label: "Resolvida", icon: CheckCircle2, className: "text-primary bg-accent" },
};

type Denuncia = {
  codigo_acompanhamento: string;
  tipo: string;
  escola: string;
  status: "pendente" | "em_analise" | "resolvida";
  response_text: string | null;
  created_at: string;
  resolved_at: string | null;
};

const tipoLabels: Record<string, string> = {
  bullying: "Bullying / Assédio",
  estrutural: "Problema Estrutural",
  comunicacao: "Comunicação com a Gestão",
  outro: "Outro",
};

const Acompanhar = () => {
  const { toast } = useToast();
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [denuncia, setDenuncia] = useState<Denuncia | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from("denuncias")
      .select("codigo_acompanhamento, tipo, escola, status, response_text, created_at, resolved_at")
      .eq("codigo_acompanhamento", codigo.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) {
      setDenuncia(null);
      toast({ title: "Denúncia não encontrada", description: "Verifique o código e tente novamente.", variant: "destructive" });
    } else {
      setDenuncia(data as Denuncia);
    }
    setLoading(false);
  };

  const StatusBadge = ({ status }: { status: "pendente" | "em_analise" | "resolvida" }) => {
    const cfg = statusConfig[status];
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${cfg.className}`}>
        <cfg.icon className="h-3.5 w-3.5" /> {cfg.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="container max-w-lg">
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
              <Search className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">Acompanhar Denúncia</h1>
            <p className="text-muted-foreground">
              Digite o código de acompanhamento recebido após sua denúncia.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3 mb-8 animate-fade-in-up-delay-1">
            <Input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: DEN-2026-7842"
              className="text-center font-mono text-lg tracking-wider"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "..." : <Search className="h-4 w-4" />}
            </Button>
          </form>

          {searched && denuncia && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-fade-in-up space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-muted-foreground">{denuncia.codigo_acompanhamento}</span>
                <StatusBadge status={denuncia.status} />
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo: </span>
                  <span className="font-medium">{tipoLabels[denuncia.tipo] || denuncia.tipo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Escola: </span>
                  <span className="font-medium">{denuncia.escola}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Enviada em: </span>
                  <span className="font-medium">{new Date(denuncia.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                {denuncia.resolved_at && (
                  <div>
                    <span className="text-muted-foreground">Resolvida em: </span>
                    <span className="font-medium">{new Date(denuncia.resolved_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                )}
              </div>
              {denuncia.response_text && (
                <div className="mt-4 rounded-lg bg-accent/50 border border-accent p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-accent-foreground" />
                    <span className="text-sm font-semibold text-accent-foreground">Resposta da Gestão</span>
                  </div>
                  <p className="text-sm text-foreground">{denuncia.response_text}</p>
                </div>
              )}
            </div>
          )}

          {searched && !denuncia && !loading && (
            <div className="text-center py-10 text-muted-foreground animate-fade-in-up">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nenhuma denúncia encontrada com este código.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Acompanhar;
