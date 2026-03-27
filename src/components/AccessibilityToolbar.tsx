import { useState, useEffect } from "react";
import { Accessibility, Plus, Minus, Eye, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

const AccessibilityToolbar = () => {
  const [open, setOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("a11y-font-size");
    const savedHC = localStorage.getItem("a11y-high-contrast");
    if (saved) setFontSize(parseInt(saved));
    if (savedHC === "true") setHighContrast(true);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
    localStorage.setItem("a11y-font-size", String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem("a11y-high-contrast", String(highContrast));
  }, [highContrast]);

  const increase = () => setFontSize((s) => Math.min(s + 10, 150));
  const decrease = () => setFontSize((s) => Math.max(s - 10, 80));
  const reset = () => { setFontSize(100); setHighContrast(false); };

  return (
    <div className="fixed bottom-20 left-4 z-50" role="toolbar" aria-label="Ferramentas de acessibilidade">
      <Button
        onClick={() => setOpen(!open)}
        size="icon"
        className="h-12 w-12 rounded-full shadow-elevated bg-secondary text-secondary-foreground hover:bg-secondary/90"
        aria-label="Abrir ferramentas de acessibilidade"
        aria-expanded={open}
      >
        <Accessibility className="h-5 w-5" />
      </Button>

      {open && (
        <div className="absolute bottom-14 left-0 glass rounded-2xl p-4 shadow-elevated w-56 space-y-3 animate-fade-in-up">
          <p className="text-sm font-display font-semibold flex items-center gap-2">
            <Accessibility className="h-4 w-4 text-secondary" /> Acessibilidade
          </p>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Type className="h-3 w-3" /> Tamanho da Fonte ({fontSize}%)
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={decrease} aria-label="Diminuir fonte">
                <Minus className="h-3 w-3" />
              </Button>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${((fontSize - 80) / 70) * 100}%` }} />
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={increase} aria-label="Aumentar fonte">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" /> Alto Contraste
            </span>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`relative h-6 w-11 rounded-full transition-colors ${highContrast ? "bg-secondary" : "bg-muted"}`}
              role="switch"
              aria-checked={highContrast}
              aria-label="Alternar alto contraste"
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${highContrast ? "translate-x-5" : ""}`} />
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={reset} className="w-full text-xs rounded-lg">
            Restaurar Padrão
          </Button>
        </div>
      )}
    </div>
  );
};

export default AccessibilityToolbar;
