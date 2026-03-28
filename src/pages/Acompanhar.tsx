import { useState, useEffect } from "react";
import { Search, Clock, CheckCircle2, AlertCircle, MessageSquare, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PageTransition from "@/components/PageTransition";
import ConfettiCelebration from "@/components/ConfettiCelebration";
import FeedbackForm from "@/components/FeedbackForm";
import { motion } from "framer-motion";

const statusConfig = {
  pendente: { label: "Pendente", icon: Clock, className: "text-urgency-medium bg-urgency-medium/10" },
  em_analise: { label: "Em Análise", icon: AlertCircle, className: "text-secondary bg-secondary/10" },
  resolvida: { label: "Resolvida", icon: CheckCircle2, className: "text-primary bg-accent" },
};

type Denuncia = {
  id: string;
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
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setLoading(true);
    setSearched(true);
    setShowConfetti(false);

    const { data, error } = await supabase
      .rpc("lookup_denuncia_by_code", { p_codigo: codigo.trim().toUpperCase() });

    const row = Array.isArray(data) ? data[0] : data;

    if (error || !row) {
      setDenuncia(null);
      toast({ title: "Denúncia não encontrada", description: "Verifique o código e tente novamente.", variant: "destructive" });
    } else {
      setDenuncia(row as unknown as Denuncia);
      if (row.status === "resolvida") {
        setTimeout(() => setShowConfetti(true), 300);
      }
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
    <PageTransition>
    <div className="min-h-screen flex flex-col">
      <Header />
      <ConfettiCelebration trigger={showConfetti} type="resolved" />
      <main className="flex-1 py-12 md:py-16">
        <div className="container max-w-lg">
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
              <Search className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">Acompanhar Denúncia</h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
              Teste o fluxo de acompanhar denúncia em /acompanhar para verificar que a busca por código ainda funciona corretamente após as mudanças de segurança. Ative a Proteção contra Senhas Vazadas: acesse Lovable Cloud → Users → Auth Settings → Email → ative 'Password HIBP Check'.
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
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4"
            >
              {/* Resolved celebration banner */}
              {denuncia.status === "resolvida" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center"
                >
                  <PartyPopper className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-primary">Denúncia Resolvida! 🎉</p>
                  <p className="text-xs text-muted-foreground mt-1">A escola tomou providências sobre esta denúncia.</p>
                </motion.div>
              )}

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

              {/* Feedback for resolved */}
              {denuncia.status === "resolvida" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <FeedbackForm denunciaId={denuncia.id} />
                </motion.div>
              )}

              {/* WhatsApp notification */}
              <div className="pt-3 border-t border-border flex flex-col sm:flex-row gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `📋 *Escola Segura Report*\n\nCódigo: ${denuncia.codigo_acompanhamento}\nStatus: ${statusConfig[denuncia.status].label}\nEscola: ${denuncia.escola}\n${denuncia.status === "resolvida" ? "✅ Denúncia resolvida!" : "⏳ Aguardando providências"}\n\nAcompanhe em: ${window.location.origin}/acompanhar`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[hsl(142,73%,28%)] text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                  aria-label="Compartilhar status via WhatsApp"
                >
                  📱 Compartilhar via WhatsApp
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    navigator.clipboard.writeText(denuncia.codigo_acompanhamento);
                    toast({ title: "Código copiado! 📋" });
                  }}
                >
                  Copiar Código
                </Button>
              </div>
            </motion.div>
          )}

          {searched && !denuncia && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-10 text-muted-foreground"
            >
              <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nenhuma denúncia encontrada com este código.</p>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
    </PageTransition>
  );
};

export default Acompanhar;
