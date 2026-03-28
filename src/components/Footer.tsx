import { Shield, Heart, Instagram, Mail, MapPin, Globe, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const { settings } = useSiteSettings();
  return (
  <footer className="border-t border-border bg-muted/40 py-16">
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16">
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <div className="flex items-center gap-2 font-display font-extrabold text-2xl mb-4 text-primary">
            <Shield className="h-7 w-7" />
            Escola Segura Report
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Plataforma anônima e segura de denúncias escolares. Nossa missão é promover ambientes educacionais mais justos, pacíficos e inclusivos através da tecnologia e transparência.
          </p>
          <div className="flex gap-4">
            <a href="#" className="h-10 w-10 rounded-full bg-accent flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Instagram className="h-5 w-5 text-primary" />
            </a>
            <a href="#" className="h-10 w-10 rounded-full bg-accent flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Mail className="h-5 w-5 text-primary" />
            </a>
          </div>
        </div>

        <div className="col-span-1">
          <h4 className="font-display font-bold text-lg mb-6">Navegação</h4>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground font-medium">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-2">Início</Link>
            <Link to="/denunciar" className="hover:text-primary transition-colors flex items-center gap-2">Fazer Denúncia</Link>
            <Link to="/acompanhar" className="hover:text-primary transition-colors flex items-center gap-2">Acompanhar Status</Link>
            <Link to="/sobre" className="hover:text-primary transition-colors flex items-center gap-2">Sobre o Projeto</Link>
          </div>
        </div>

        <div className="col-span-1">
          <h4 className="font-display font-bold text-lg mb-6">Legal & Suporte</h4>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground font-medium">
            <Link to="/politica-de-privacidade#politica-privacidade" className="hover:text-primary transition-colors">Política de Privacidade</Link>
            <Link to="/politica-de-privacidade#termos-uso" className="hover:text-primary transition-colors">Termos de Uso</Link>
            <Link to="/ajuda" className="hover:text-primary transition-colors">Central de Ajuda</Link>
            <Link to="/contato" className="hover:text-primary transition-colors">Contato Direto</Link>
          </div>
        </div>

        <div className="col-span-1">
          <h4 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
            ODS 16 <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-tighter">ONU</span>
          </h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Estamos alinhados ao Objetivo 16: Paz, Justiça e Instituições Eficazes. Promovemos ambientes seguros por meio do diálogo e responsabilidade.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <CheckCircle2 className="h-4 w-4" /> Alinhamento Certificado
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Escola Segura Report. Todos os direitos reservados.</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/50 border border-border/50">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>São Luís, MA</span>
          </div>
          <p className="flex items-center">
            Feito com <Heart className="inline h-3.5 w-3.5 text-destructive mx-1.5 fill-destructive animate-pulse" /> para o futuro do Brasil
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
