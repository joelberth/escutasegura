import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => (
  <a
    href="https://wa.me/5585999999999?text=Olá! Preciso de ajuda com o Escola Segura."
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(142,73%,28%)] shadow-elevated hover:scale-105 transition-transform"
    aria-label="Suporte via WhatsApp"
  >
    <MessageCircle className="h-6 w-6 text-primary-foreground" />
  </a>
);

export default WhatsAppButton;
