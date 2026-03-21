import { Target, Shield, Users, Building2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AnimatedCounter from "@/components/AnimatedCounter";
import PageTransition from "@/components/PageTransition";

const stats = [
  { label: "Denúncias registradas", value: 1247 },
  { label: "Escolas impactadas", value: 48 },
  { label: "Casos resolvidos", value: 892 },
];

const Sobre = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      {/* Hero */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container max-w-3xl text-center">
          <div className="h-16 w-16 rounded-2xl trust-gradient flex items-center justify-center mx-auto mb-6">
            <Target className="h-8 w-8 text-secondary-foreground" />
          </div>
          <h1 className="text-4xl font-display font-extrabold mb-4">Sobre o Escola Segura</h1>
          <p className="text-lg text-muted-foreground">
            Uma plataforma criada para dar voz a quem mais precisa — estudantes, pais e comunidades escolares —
            de forma totalmente anônima e segura.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-border">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-display font-bold text-primary">
                  <AnimatedCounter end={s.value} />
                </p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ODS 16 */}
      <section className="py-16 md:py-20">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Impacto ODS 16</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Paz nas Escolas", desc: "Denúncias anônimas ajudam a prevenir violência e bullying nos ambientes escolares." },
              { icon: Users, title: "Justiça Acessível", desc: "Estudantes de qualquer contexto social podem reportar problemas sem medo." },
              { icon: Building2, title: "Instituições Eficazes", desc: "Gestores ganham dados reais para tomar decisões mais justas e fundamentadas." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-6 shadow-card text-center">
                <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container text-center max-w-2xl">
          <h2 className="text-3xl font-display font-bold mb-4">Faça parte dessa mudança</h2>
          <p className="text-muted-foreground mb-8">
            Cada denúncia é um passo rumo a escolas mais seguras e justas para todos.
          </p>
          <Link to="/denunciar">
            <Button size="lg" className="text-base px-8 gap-2">
              Fazer Denúncia <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
    <Footer />
    <WhatsAppButton />
  </div>
);

export default Sobre;
