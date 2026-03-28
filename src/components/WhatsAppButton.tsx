import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => (
  <a
    href="https://wa.me/5585999999999?text=Olá! Preciso de ajuda com o Escola Segura."
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 group items-center justify-center rounded-full bg-primary shadow-elevated hover:scale-105 transition-transform"
    aria-label="Suporte via WhatsApp"
  >
    <div className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-soft pointer-events-none">
      Dúvidas? Fale conosco
    </div>
    <MessageCircle className="h-6 w-6 text-primary-foreground" />
  </a>
);

export default WhatsAppButton;
