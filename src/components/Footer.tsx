import { Shield, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-muted/30 py-12">
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 font-display font-bold text-lg mb-3">
            <Shield className="h-5 w-5 text-primary" />
            Escola Segura Report
          </div>
          <p className="text-sm text-muted-foreground">
            Plataforma anônima de denúncias escolares alinhada ao ODS 16.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3">Links</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/denunciar" className="hover:text-foreground transition-colors">Fazer Denúncia</Link>
            <Link to="/acompanhar" className="hover:text-foreground transition-colors">Acompanhar</Link>
            <Link to="/sobre" className="hover:text-foreground transition-colors">Sobre o Projeto</Link>
            <Link to="/politica-de-privacidade#politica-privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3">ODS 16</h4>
          <p className="text-sm text-muted-foreground">
            Paz, Justiça e Instituições Eficazes. Promovendo ambientes escolares seguros.
          </p>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-border text-center text-sm text-muted-foreground">
        Feito com <Heart className="inline h-3.5 w-3.5 text-destructive mx-0.5" /> para escolas brasileiras • Maranhão
      </div>
    </div>
  </footer>
);

export default Footer;
