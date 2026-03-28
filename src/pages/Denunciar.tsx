import { useState, useEffect } from "react";
import { Shield, Upload, CheckCircle2, Copy, Search, Lock, FileText, Eye, Scale, Database } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PageTransition from "@/components/PageTransition";
import ConfettiCelebration from "@/components/ConfettiCelebration";
import DenunciaChatbot from "@/components/DenunciaChatbot";

const tipoLabels: Record<string, string> = {
  bullying: "Bullying / Assédio",
  estrutural: "Problema Estrutural",
  comunicacao: "Comunicação com a Gestão",
  outro: "Outro",
};

const urgenciaOptions = [
  { value: "baixa" as const, label: "Baixa", color: "bg-urgency-low" },
  { value: "media" as const, label: "Média", color: "bg-urgency-medium" },
  { value: "alta" as const, label: "Alta", color: "bg-urgency-high" },
];

const exampleData = {
  tipo: "bullying" as const,
  escola: "Centro Educa Mais Paulo Freire",
  descricao: "Alunos do 9º ano estão praticando bullying contra um colega com deficiência durante o recreio. A situação já acontece há semanas e nenhum professor tomou providência.",
  urgencia: "alta" as const,
};

function generateCode() {
  const year = new Date().getFullYear();
  // Using a more secure and less guessable format (8 random chars)
  const randomChars = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `DEN-${year}-${randomChars}`;
}

const termoSections = [
  { icon: Shield, title: "Anonimato total", text: "Nenhum dado pessoal é coletado. A plataforma foi projetada para tornar impossível a identificação do denunciante." },
  { icon: Lock, title: "Confidencialidade", text: "Acesso restrito apenas à gestão autorizada. Nenhum dado é compartilhado com terceiros." },
  { icon: FileText, title: "Finalidade", text: "Apenas investigação interna e melhoria contínua do ambiente escolar." },
  { icon: Scale, title: "Responsabilidade", text: "Declaro que as informações fornecidas são verdadeiras e baseadas em fatos reais." },
  { icon: Database, title: "LGPD", text: "Tratamento de dados conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)." },
];

const TermoAceiteSection = ({ aceito, setAceito }: { aceito: boolean; setAceito: (v: boolean) => void }) => {
  const [showTermo, setShowTermo] = useState(false);

  return (
    <>
      <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-secondary/10 p-5 shadow-sm shadow-primary/5">
        <div className="flex items-start gap-3">
          <Checkbox
            id="aceito"
            required
            checked={aceito}
            onCheckedChange={(checked) => setAceito(checked === true)}
            className="mt-1 h-5 w-5 border-primary/40 data-[state=checked]:bg-primary"
          />
          <div>
            <label htmlFor="aceito" className="text-sm leading-relaxed cursor-pointer text-foreground">
              <Shield className="h-4 w-4 inline text-primary mr-1 -mt-0.5" />
              ✅ Aceito que esta denúncia seja totalmente anônima e declaro estar ciente de que será tratada com{" "}
              <strong>confidencialidade total</strong> pela gestão da escola, respeitando a{" "}
              <strong>LGPD</strong>. Entendo que a plataforma não coleta nenhum dado pessoal meu e que denúncias de má-fé podem ter consequências legais.{" "}
              Li e concordo com o{" "}
              <button type="button" onClick={() => setShowTermo(true)} className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80 transition-colors">
                Termo de Aceite e Confidencialidade
              </button>.
            </label>
            <div className="flex items-center gap-3 mt-3">
              <button type="button" onClick={() => setShowTermo(true)} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                <Eye className="h-3 w-3" /> Ver Termo Completo
              </button>
              <Link to="/politica-de-privacidade#politica-privacidade" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">
                <Lock className="h-3 w-3" /> Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showTermo} onOpenChange={setShowTermo}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Shield className="h-5 w-5 text-primary" />
              Termo de Aceite e Confidencialidade
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {termoSections.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{i + 1}. {s.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.text}</p>
                </div>
              </div>
            ))}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
              <Lock className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Ao marcar o checkbox e enviar a denúncia, você concorda com todos os termos acima.
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 rounded-xl gap-2" onClick={() => { setAceito(true); setShowTermo(false); }}>
                <CheckCircle2 className="h-4 w-4" /> Aceitar Termos
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => setShowTermo(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Denunciar = () => {
  const { toast } = useToast();
  const [tipo, setTipo] = useState("");
  const [escola, setEscola] = useState("");
  const [escolaSearch, setEscolaSearch] = useState("");
  const [escolas, setEscolas] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [descricao, setDescricao] = useState(() => localStorage.getItem("denuncia_draft_descricao") || "");
  const [urgencia, setUrgencia] = useState<"baixa" | "media" | "alta">("media");
  const [aceito, setAceito] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    localStorage.setItem("denuncia_draft_descricao", descricao);
  }, [descricao]);

  useEffect(() => {
    supabase.from("escolas").select("nome").then(({ data }) => {
      if (data) setEscolas(data.map((e) => e.nome));
    });
  }, []);

  const filteredEscolas = escolas.filter((e) =>
    e.toLowerCase().includes(escolaSearch.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (files.length + newFiles.length > 3) {
      toast({ title: "Máximo 3 arquivos", variant: "destructive" });
      return;
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    for (const file of newFiles) {
      if (file.size > maxSize) {
        toast({ title: `Arquivo "${file.name}" excede 10MB`, variant: "destructive" });
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        toast({ title: `Tipo de arquivo não permitido: ${file.name}`, variant: "destructive" });
        return;
      }
    }
    setFiles([...files, ...newFiles]);
  };

  const fillExample = () => {
    setTipo(exampleData.tipo);
    setEscola(exampleData.escola);
    setEscolaSearch(exampleData.escola);
    setDescricao(exampleData.descricao);
    setUrgencia(exampleData.urgencia);
    setAceito(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEscola = escola.trim();
    const trimmedDescricao = descricao.trim();
    if (!tipo || !trimmedEscola || !trimmedDescricao) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (!aceito) {
      toast({ title: "Você precisa aceitar o Termo de Confidencialidade para enviar a denúncia.", variant: "destructive" });
      return;
    }
    if (trimmedDescricao.length < 10) {
      toast({ title: "A descrição deve ter pelo menos 10 caracteres", variant: "destructive" });
      return;
    }
    if (trimmedDescricao.length > 5000) {
      toast({ title: "A descrição deve ter no máximo 5000 caracteres", variant: "destructive" });
      return;
    }
    if (trimmedEscola.length > 200) {
      toast({ title: "Nome da escola muito longo", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      // Upload files
      const arquivoUrls: string[] = [];
      for (const file of files) {
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("evidencias")
          .upload(fileName, file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("evidencias").getPublicUrl(fileName);
          arquivoUrls.push(urlData.publicUrl);
        }
      }

      const codigoAcompanhamento = generateCode();

      // To ensure 100% anonymity as promised, we do not store IP, specific location, or detailed device info.
      const deviceInfo = (() => {
        const ua = navigator.userAgent;
        if (/Mobi|Android/i.test(ua)) return "Mobile";
        if (/Tablet|iPad/i.test(ua)) return "Tablet";
        return "Desktop";
      })();

      const { error } = await supabase.from("denuncias").insert({
        tipo: tipo as "bullying" | "estrutural" | "comunicacao" | "outro",
        escola,
        descricao,
        urgencia,
        codigo_acompanhamento: codigoAcompanhamento,
        arquivo_urls: arquivoUrls,
        ip_address: "Anônimo",
        device_info: deviceInfo,
        location_info: "Anônimo",
        latitude: null,
        longitude: null,
        termo_aceito: true,
      } as any);

      if (error) throw error;

      localStorage.removeItem("denuncia_draft_descricao");
      setCodigo(codigoAcompanhamento);
      setSuccess(true);
      toast({ title: "Denúncia enviada com sucesso! ✅" });

      // Notify gestores
      supabase.functions.invoke("notify-denuncia", {
        body: { codigo: codigoAcompanhamento, tipo, escola, urgencia },
      }).catch(() => {});
    } catch {
      toast({ title: "Erro ao enviar denúncia. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Header />
        <ConfettiCelebration trigger={true} type="submit" />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="container max-w-md text-center animate-fade-in-up">
            <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-3">Denúncia Enviada!</h1>
            <p className="text-muted-foreground mb-6">
              Sua denúncia foi registrada com total confidencialidade. Use o código abaixo para acompanhar.
            </p>
            <div className="rounded-xl border border-border bg-muted p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-1">Código de Acompanhamento</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-display font-bold tracking-wider">{codigo}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(codigo); toast({ title: "Código copiado!" }); }}
                  className="p-1.5 rounded-md hover:bg-accent transition-colors"
                >
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/acompanhar">
                <Button className="w-full gap-2"><Search className="h-4 w-4" /> Acompanhar minha denúncia</Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="w-full">Voltar ao início</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="container max-w-2xl">
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">Fazer Denúncia Anônima</h1>
            <p className="text-muted-foreground">
              Sua identidade é completamente protegida. Preencha o formulário abaixo.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  (s === 1 && tipo) || (s === 2 && escola) || (s === 3 && descricao) || (s === 4 && aceito)
                    ? "bg-primary w-full"
                    : "bg-muted w-full opacity-50"
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up-delay-1 p-6 md:p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm shadow-soft" aria-label="Formulário de denúncia anônima">
            {/* Demo button */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> Conexão Criptografada
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={fillExample} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Preencher com exemplo
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold flex items-center gap-2" id="tipo-label">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">1</span>
                  Tipo de Denúncia *
                </label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="h-12 rounded-xl border-border/50 focus:ring-primary/20"><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoLabels).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Escola */}
              <div className="space-y-2.5 relative">
                <label className="text-sm font-bold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">2</span>
                  Nome da Escola *
                </label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    className="h-12 pl-10 rounded-xl border-border/50 focus:ring-primary/20"
                    value={escolaSearch}
                    onChange={(e) => { setEscolaSearch(e.target.value); setEscola(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Ex: Centro Educa Mais Paulo Freire"
                  />
                </div>
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] text-muted-foreground">Não encontrou sua escola? Digite o nome completo acima.</p>
                </div>
                {showSuggestions && escolaSearch && filteredEscolas.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full rounded-xl border border-border bg-popover shadow-elevated max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                    {filteredEscolas.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="w-full text-left px-4 py-3 text-sm hover:bg-accent transition-colors font-medium"
                        onClick={() => { setEscola(e); setEscolaSearch(e); setShowSuggestions(false); }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-end">
                <label className="text-sm font-bold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">3</span>
                  Descrição Detalhada *
                </label>
                <span className={`text-[10px] font-mono ${descricao.length > 4500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {descricao.length}/5000
                </span>
              </div>
              <Textarea
                className="rounded-xl border-border/50 focus:ring-primary/20 min-h-[160px] resize-none"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o que aconteceu com o máximo de detalhes possível. Sua identidade será mantida em total sigilo."
                maxLength={5000}
              />
              <p className="text-[10px] text-muted-foreground px-1 italic">
                💡 Dica: Tente responder QUEM, ONDE e QUANDO o fato ocorreu.
              </p>
            </div>

            {/* Urgência */}
            <div className="space-y-2.5">
              <label className="text-sm font-bold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">4</span>
                Nível de Urgência
              </label>
              <div className="flex gap-4">
                {urgenciaOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUrgencia(opt.value)}
                    className={`flex-1 rounded-xl border-2 py-3.5 text-sm font-bold transition-all shadow-sm ${
                      urgencia === opt.value
                        ? "border-primary bg-primary/5 text-primary scale-[1.02]"
                        : "border-border/50 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${opt.color} mr-2 shadow-sm`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Evidências (opcional — máx. 3 arquivos)</label>
              <label className="block rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors p-6 text-center cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Arraste arquivos ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground">Imagens (JPG, PNG, GIF, WebP) e PDF — máx. 10MB cada</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Selecionar arquivos de evidência"
                />
              </label>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {files.map((f, i) => (
                    <span key={i} className="text-xs bg-muted px-2 py-1 rounded-md">
                      {f.name}
                      <button type="button" className="ml-1 text-muted-foreground" onClick={() => setFiles(files.filter((_, j) => j !== i))}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Aceite LGPD */}
            <TermoAceiteSection aceito={aceito} setAceito={setAceito} />

            <div className="space-y-3">
              <Button type="submit" size="lg" className="w-full text-base gap-2 shadow-lg shadow-primary/20" disabled={loading || !aceito}>
                {loading ? "Enviando..." : (
                  <>
                    <Shield className="h-4 w-4" /> Enviar Denúncia com Segurança
                  </>
                )}
              </Button>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                <Clock className="h-3 w-3" /> Prazo estimado de resposta: 24h a 48h úteis
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
      <DenunciaChatbot />
    </div>
    </PageTransition>
  );
};

export default Denunciar;
