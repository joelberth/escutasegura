import { Shield, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import DarkModeToggle from "@/components/DarkModeToggle";
import ProfileButton from "@/components/ProfileButton";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { settings } = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? "border-b border-border/80 bg-background/90 backdrop-blur-xl shadow-sm h-16" 
        : "bg-transparent h-20"
    }`}>
      <div className="container flex h-full items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <Shield className="h-6 w-6 text-primary" />
          <span>Escola Segura Report</span>
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
          <DarkModeToggle />
          <ProfileButton />
        </nav>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-1">
          <DarkModeToggle />
          <button className="p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
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
          <div className="pt-1">
            <ProfileButton />
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
