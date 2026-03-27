import { useState, useEffect } from "react";
import { Shield, Upload, CheckCircle2, Copy, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const num = Math.floor(1000 + Math.random() * 9000);
  return `DEN-${year}-${num}`;
}

const Denunciar = () => {
  const { toast } = useToast();
  const [tipo, setTipo] = useState("");
  const [escola, setEscola] = useState("");
  const [escolaSearch, setEscolaSearch] = useState("");
  const [escolas, setEscolas] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [urgencia, setUrgencia] = useState<"baixa" | "media" | "alta">("media");
  const [aceito, setAceito] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [codigo, setCodigo] = useState("");

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
    if (!tipo || !trimmedEscola || !trimmedDescricao || !aceito) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
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

      // Capture device info
      const deviceInfo = (() => {
        const ua = navigator.userAgent;
        if (/Mobi|Android/i.test(ua)) return "Mobile";
        if (/Tablet|iPad/i.test(ua)) return "Tablet";
        return "Desktop";
      })() + ` — ${navigator.userAgent.slice(0, 80)}`;

      // Try to get IP and location
      let ipAddress = "Não disponível";
      let locationInfo = "Não disponível";
      let latitude: number | null = null;
      let longitude: number | null = null;

      // Try browser geolocation first
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: false });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch { /* silently fail */ }

      try {
        const ipRes = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          ipAddress = ipData.ip || "Não disponível";
          locationInfo = [ipData.city, ipData.region, ipData.country_name].filter(Boolean).join(", ") || "Não disponível";
          if (!latitude && ipData.latitude) {
            latitude = ipData.latitude;
            longitude = ipData.longitude;
          }
        }
      } catch { /* silently fail */ }

      const { error } = await supabase.from("denuncias").insert({
        tipo: tipo as "bullying" | "estrutural" | "comunicacao" | "outro",
        escola,
        descricao,
        urgencia,
        codigo_acompanhamento: codigoAcompanhamento,
        arquivo_urls: arquivoUrls,
        ip_address: ipAddress,
        device_info: deviceInfo,
        location_info: locationInfo,
        latitude: latitude as any,
        longitude: longitude as any,
      });

      if (error) throw error;

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

          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up-delay-1" aria-label="Formulário de denúncia anônima">
            {/* Demo button */}
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={fillExample} className="text-xs text-muted-foreground">
                Preencher com exemplo
              </Button>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Denúncia *</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Escola */}
            <div className="space-y-2 relative">
              <label className="text-sm font-medium">Nome da Escola *</label>
              <Input
                value={escolaSearch}
                onChange={(e) => { setEscolaSearch(e.target.value); setEscola(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ex: Centro Educa Mais Paulo Freire"
              />
              {showSuggestions && escolaSearch && filteredEscolas.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-40 overflow-y-auto">
                  {filteredEscolas.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => { setEscola(e); setEscolaSearch(e); setShowSuggestions(false); }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição Detalhada *</label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o que aconteceu com o máximo de detalhes possível..."
                rows={5}
              />
            </div>

            {/* Urgência */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nível de Urgência</label>
              <div className="flex gap-3">
                {urgenciaOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUrgencia(opt.value)}
                    className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-all ${
                      urgencia === opt.value
                        ? "border-primary bg-accent text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <span className={`inline-block h-2 w-2 rounded-full ${opt.color} mr-2`} />
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

            {/* Aceite */}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4">
              <Checkbox
                id="aceito"
                checked={aceito}
                onCheckedChange={(checked) => setAceito(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="aceito" className="text-sm text-muted-foreground cursor-pointer">
                Aceito que esta denúncia seja anônima e será tratada com confidencialidade total.
              </label>
            </div>

            <Button type="submit" size="lg" className="w-full text-base gap-2" disabled={loading}>
              {loading ? "Enviando..." : (
                <>
                  <Shield className="h-4 w-4" /> Enviar Denúncia com Segurança
                </>
              )}
            </Button>
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
