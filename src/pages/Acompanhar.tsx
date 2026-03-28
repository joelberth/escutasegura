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
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Search className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">Acompanhar Denúncia</h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
              Insira o código de acompanhamento recebido no momento da denúncia para verificar o status atual e possíveis respostas da gestão.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 mb-10 animate-fade-in-up-delay-1 p-2 rounded-2xl border border-border bg-card shadow-soft items-center transition-all focus-within:ring-2 focus-within:ring-primary/20">
            <div className="flex-1 relative group">
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="EX: DEN-2026-ABC12345"
                className="h-12 border-none focus-visible:ring-0 text-center font-mono text-lg tracking-widest placeholder:tracking-normal placeholder:font-sans uppercase"
              />
            </div>
            <Button type="submit" disabled={loading} size="lg" className="rounded-xl h-12 px-8 gap-2 shadow-lg shadow-primary/20">
              {loading ? "..." : <><Search className="h-4 w-4" /> Buscar</>}
            </Button>
          </form>

          {searched && denuncia && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Timeline Horizontal */}
              <div className="rounded-2xl border border-border bg-card/50 p-6 shadow-soft mb-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 text-center">Status da Jornada</p>
                <div className="relative flex justify-between">
                  <div className="absolute top-4 left-0 w-full h-0.5 bg-muted -z-10" />
                  <div className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-1000 -z-10" style={{ 
                    width: denuncia.status === 'pendente' ? '0%' : denuncia.status === 'em_analise' ? '50%' : '100%' 
                  }} />
                  
                  {[
                    { key: 'pendente', label: 'Enviada', icon: Clock },
                    { key: 'em_analise', label: 'Em Análise', icon: AlertCircle },
                    { key: 'resolvida', label: 'Resolvida', icon: CheckCircle2 }
                  ].map((step, i) => {
                    const isActive = denuncia.status === step.key || (denuncia.status === 'em_analise' && i === 0) || (denuncia.status === 'resolvida');
                    const isCurrent = denuncia.status === step.key;
                    
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 border-4 bg-background ${
                          isActive ? 'border-primary text-primary shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'border-muted text-muted-foreground'
                        } ${isCurrent ? 'scale-110' : 'scale-100'}`}>
                          <step.icon className="h-3.5 w-3.5" />
                        </div>
                        <span className={`text-[10px] font-bold uppercase transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
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

                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Código de Protocolo</p>
                    <span className="font-mono text-lg font-bold text-primary">{denuncia.codigo_acompanhamento}</span>
                  </div>
                  <StatusBadge status={denuncia.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Tipo</p>
                    <p className="font-medium">{tipoLabels[denuncia.tipo] || denuncia.tipo}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Data de Envio</p>
                    <p className="font-medium">{new Date(denuncia.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Escola Selecionada</p>
                    <p className="font-medium">{denuncia.escola}</p>
                  </div>
                </div>

                {denuncia.response_text && (
                  <div className="mt-4 rounded-xl bg-secondary/5 border border-secondary/20 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-7 w-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-secondary" />
                      </div>
                      <span className="text-xs font-bold text-secondary uppercase tracking-wider">Resposta da Gestão</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed italic border-l-2 border-secondary/30 pl-3">
                      "{denuncia.response_text}"
                    </p>
                  </div>
                )}

                {/* Feedback for resolved */}
                {denuncia.status === "resolvida" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="pt-4"
                  >
                    <FeedbackForm denunciaId={denuncia.id} />
                  </motion.div>
                )}

                {/* WhatsApp notification */}
                <div className="pt-5 border-t border-border flex flex-col sm:flex-row gap-3">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `📋 *Escola Segura Report*\n\nCódigo: ${denuncia.codigo_acompanhamento}\nStatus: ${statusConfig[denuncia.status].label}\nEscola: ${denuncia.escola}\n${denuncia.status === "resolvida" ? "✅ Denúncia resolvida!" : "⏳ Aguardando providências"}\n\nAcompanhe em: ${window.location.origin}/acompanhar`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(142,73%,28%)] text-primary-foreground h-12 text-sm font-bold hover:opacity-90 transition-opacity shadow-md"
                    aria-label="Compartilhar status via WhatsApp"
                  >
                    📱 Compartilhar via WhatsApp
                  </a>
                  <Button
                    variant="outline"
                    className="rounded-xl h-12 px-6 font-bold"
                    onClick={() => {
                      navigator.clipboard.writeText(denuncia.codigo_acompanhamento);
                      toast({ title: "Código copiado! 📋" });
                    }}
                  >
                    Copiar Código
                  </Button>
                </div>
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
