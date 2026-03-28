import { Shield, Building2, HandHeart, MessageSquareText, ArrowRight, Target, Search, Lock, UserCheck, CheckCircle2, Send, Globe, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AnimatedCounter from "@/components/AnimatedCounter";
import PageTransition from "@/components/PageTransition";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const benefits = [
  { icon: Shield, title: "100% Anônimo", desc: "Sua identidade nunca será revelada. Garantimos total confidencialidade por design." },
  { icon: Building2, title: "Para Todas as Escolas", desc: "Qualquer escola do Brasil pode receber denúncias pela plataforma." },
  { icon: HandHeart, title: "Acolhimento Real", desc: "Gestores recebem e respondem com responsabilidade e empatia." },
  { icon: MessageSquareText, title: "Acompanhe sua Denúncia", desc: "Use o código gerado para saber o status da sua denúncia em tempo real." },
];

const steps = [
  { icon: Send, title: "Relate o Ocorrido", desc: "Preencha o formulário de forma simples e 100% anônima." },
  { icon: Lock, title: "Receba seu Código", desc: "Um código único é gerado para que você acompanhe o progresso." },
  { icon: UserCheck, title: "Ação da Escola", desc: "A gestão recebe a denúncia e toma as providências necessárias." },
  { icon: CheckCircle2, title: "Feedback Direto", desc: "Você vê as atualizações e a resolução do problema." },
];

const testimonials = [
  { text: "Finalmente consegui relatar o bullying que sofria sem medo de represália. A escola agiu rápido!", author: "Estudante, 15 anos" },
  { text: "Como gestora, essa ferramenta me ajudou a identificar problemas que eu não sabia que existiam na minha escola.", author: "Diretora, São Luís-MA" },
  { text: "A plataforma é simples e acessível. Meu filho conseguiu fazer a denúncia sozinho pelo celular.", author: "Mãe de aluno" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Index = () => (
  <PageTransition>
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(142_73%_35%/0.15),_transparent_60%)]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
        <div className="container relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-background/10 border border-background/20 px-4 py-1.5 text-sm font-medium text-primary-foreground/90 mb-6 backdrop-blur-sm"
          >
            <Target className="h-4 w-4" /> ODS 16 — Paz, Justiça e Instituições Eficazes
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-7xl font-display font-extrabold tracking-tight text-primary-foreground leading-tight"
          >
            Denuncie com segurança.<br />Transforme sua escola.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto"
          >
            Milhares de estudantes brasileiros não têm um canal seguro para reportar problemas na escola. 
            O Escola Segura Report muda isso — de forma 100% anônima e segura.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/denunciar">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 gap-2 shadow-lg shadow-primary/20">
                Fazer Denúncia Anônima <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/acompanhar">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 gap-2 bg-background/10 border-background/30 text-primary-foreground hover:bg-background/20 hover:text-primary-foreground">
                <Search className="h-4 w-4" /> Acompanhar Denúncia
              </Button>
            </Link>
            <Link to="/admin/login">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20">
                Sou Gestor
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Counter */}
      <section className="py-12 border-b border-border bg-background">
        <div className="container text-center">
          <p className="text-3xl md:text-4xl font-display font-bold text-foreground">
            <AnimatedCounter end={1247} /> <span className="text-muted-foreground font-normal text-lg md:text-xl">denúncias já ajudaram escolas brasileiras</span>
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Por que usar o Escola Segura Report?
            </h2>
            <p className="text-muted-foreground italic">
              Desenvolvido com foco total na privacidade do aluno e na eficiência da gestão escolar.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="rounded-xl glass p-8 shadow-card hover:shadow-elevated transition-shadow border-t-4 border-t-primary"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <b.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Como Funciona?</h2>
            <p className="text-muted-foreground">O processo é simples, rápido e protege sua identidade em cada etapa.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-border z-0" />
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative z-10 text-center"
              >
                <div className="h-16 w-16 rounded-full bg-background border-4 border-primary flex items-center justify-center mx-auto mb-6 shadow-soft">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground px-4">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 md:py-28 bg-primary/5">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Segurança e Privacidade de Nível Empresarial</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Criptografia de Ponta a Ponta</h4>
                    <p className="text-sm text-muted-foreground">Todas as denúncias são criptografadas e armazenadas em servidores seguros.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Anonimato por Design</h4>
                    <p className="text-sm text-muted-foreground">Não coletamos IP, geolocalização exata ou qualquer dado que possa identificar você.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Conformidade com LGPD</h4>
                    <p className="text-sm text-muted-foreground">Totalmente alinhado à Lei Geral de Proteção de Dados brasileira.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary to-secondary p-1 overflow-hidden">
                <div className="w-full h-full rounded-[2.5rem] bg-background flex items-center justify-center p-8">
                  <Shield className="h-32 w-32 text-primary opacity-20 absolute animate-pulse" />
                  <div className="relative z-10 text-center">
                    <div className="h-20 w-20 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
                      <Lock className="h-10 w-10 text-primary" />
                    </div>
                    <p className="font-display font-bold text-2xl mb-2">Proteção Garantida</p>
                    <p className="text-muted-foreground">Sua voz importa, sua segurança é prioridade.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-muted/10">
        <div className="container">
          <h2 className="text-3xl font-display font-bold text-center mb-16">O que dizem sobre nós</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.author}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="rounded-2xl glass p-8 shadow-card border-l-4 border-l-secondary"
              >
                <p className="text-muted-foreground mb-6 italic text-lg leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                    {t.author[0]}
                  </div>
                  <p className="text-sm font-bold">— {t.author}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 trust-gradient opacity-90" />
        <div className="container relative z-10 text-center max-w-3xl mx-auto text-primary-foreground">
          <h2 className="text-4xl md:text-5xl font-display font-extrabold mb-6">Pronto para fazer a diferença?</h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 leading-relaxed">
            Sua denúncia é o primeiro passo para uma escola mais segura, justa e acolhedora para todos os estudantes.
          </p>
          <Link to="/denunciar">
            <Button size="lg" className="bg-background text-primary hover:bg-background/90 text-lg px-10 h-14 gap-2 shadow-2xl">
              Fazer Denúncia Anônima <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  </PageTransition>
);

export default Index;
