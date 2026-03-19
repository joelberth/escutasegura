import { Shield, Building2, HandHeart, MessageSquareText, ArrowRight, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AnimatedCounter from "@/components/AnimatedCounter";

const benefits = [
  { icon: Shield, title: "100% Anônimo", desc: "Sua identidade nunca será revelada. Garantimos total confidencialidade." },
  { icon: Building2, title: "Para Todas as Escolas", desc: "Qualquer escola do Brasil pode receber denúncias pela plataforma." },
  { icon: HandHeart, title: "Acolhimento Real", desc: "Gestores recebem e respondem com responsabilidade e empatia." },
  { icon: MessageSquareText, title: "Acompanhe sua Denúncia", desc: "Use o código gerado para saber o status da sua denúncia." },
];

const testimonials = [
  { text: "Finalmente consegui relatar o bullying que sofria sem medo de represália. A escola agiu rápido!", author: "Estudante, 15 anos" },
  { text: "Como gestora, essa ferramenta me ajudou a identificar problemas que eu não sabia que existiam na minha escola.", author: "Diretora, Fortaleza-CE" },
  { text: "A plataforma é simples e acessível. Meu filho conseguiu fazer a denúncia sozinho pelo celular.", author: "Mãe de aluno" },
];

const Index = () => (
  <div className="min-h-screen flex flex-col">
    <Header />

    {/* Hero */}
    <section className="hero-gradient relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(142_73%_35%/0.15),_transparent_60%)]" />
      <div className="container relative z-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary-foreground/90 mb-6 animate-fade-in-up">
          <Target className="h-4 w-4" /> ODS 16 — Paz, Justiça e Instituições Eficazes
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-primary-foreground animate-fade-in-up leading-tight">
          Denuncie com segurança.<br />Transforme sua escola.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-primary-foreground/70 animate-fade-in-up-delay-1 max-w-2xl mx-auto">
          Milhares de estudantes brasileiros não têm um canal seguro para reportar problemas na escola. 
          O Escola Segura muda isso — de forma 100% anônima.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up-delay-2">
          <Link to="/denunciar">
            <Button size="lg" className="w-full sm:w-auto text-base px-8 gap-2">
              Fazer Denúncia Anônima <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/admin/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
              Sou Gestor
            </Button>
          </Link>
        </div>
      </div>
    </section>

    {/* Counter */}
    <section className="py-12 border-b border-border">
      <div className="container text-center">
        <p className="text-3xl md:text-4xl font-display font-bold text-foreground">
          <AnimatedCounter end={1247} /> <span className="text-muted-foreground font-normal text-lg md:text-xl">denúncias já ajudaram escolas brasileiras</span>
        </p>
      </div>
    </section>

    {/* ODS 16 */}
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container max-w-4xl">
        <div className="rounded-2xl border border-border bg-card p-8 md:p-10 shadow-card flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 h-20 w-20 rounded-2xl trust-gradient flex items-center justify-center">
            <Target className="h-10 w-10 text-secondary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold mb-2">ODS 16 — Paz, Justiça e Instituições Eficazes</h2>
            <p className="text-muted-foreground">
              O Escola Segura está alinhado ao Objetivo de Desenvolvimento Sustentável 16 da ONU, 
              que visa promover sociedades pacíficas e inclusivas, proporcionar acesso à justiça para todos 
              e construir instituições eficazes, responsáveis e inclusivas em todos os níveis.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Benefits */}
    <section className="py-16 md:py-20">
      <div className="container">
        <h2 className="text-3xl font-display font-bold text-center mb-12">Por que usar o Escola Segura?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <div key={b.title} className={`rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-elevated transition-shadow animate-fade-in-up-delay-${Math.min(i, 3) + 1}`}>
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                <b.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Testimonials */}
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container">
        <h2 className="text-3xl font-display font-bold text-center mb-12">O que dizem sobre nós</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.author} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <p className="text-muted-foreground mb-4 italic">"{t.text}"</p>
              <p className="text-sm font-semibold">— {t.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 md:py-20">
      <div className="container text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-display font-bold mb-4">Pronto para fazer a diferença?</h2>
        <p className="text-muted-foreground mb-8">Sua denúncia é o primeiro passo para uma escola mais segura e justa.</p>
        <Link to="/denunciar">
          <Button size="lg" className="text-base px-8 gap-2">
            Fazer Denúncia Anônima <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>

    <Footer />
    <WhatsAppButton />
  </div>
);

export default Index;
