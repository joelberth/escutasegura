import { Shield, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <Shield className="h-6 w-6 text-primary" />
          <span>Escola Segura</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Início</Link>
          <Link to="/denunciar" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Denunciar</Link>
          <Link to="/acompanhar" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Acompanhar</Link>
          <Link to="/sobre" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sobre</Link>
          <Link to="/admin/login">
            <Button variant="outline" size="sm">Sou Gestor</Button>
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-background p-4 flex flex-col gap-3 animate-fade-in-up">
          <Link to="/" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-2">Início</Link>
          <Link to="/denunciar" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-2">Denunciar</Link>
          <Link to="/acompanhar" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-2">Acompanhar</Link>
          <Link to="/sobre" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-2">Sobre</Link>
          <Link to="/admin/login" onClick={() => setMenuOpen(false)}>
            <Button variant="outline" size="sm" className="w-full">Sou Gestor</Button>
          </Link>
        </nav>
      )}
    </header>
  );
};

export default Header;
