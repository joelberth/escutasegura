import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

const QUICK_QUESTIONS = [
  "O que posso denunciar?",
  "Minha denúncia é anônima?",
  "Como acompanho minha denúncia?",
  "O que é urgência alta?",
];

const DenunciaChatbot = ({ inline = false, onStartForm }: { inline?: boolean; onStartForm?: () => void }) => {
  const [open, setOpen] = useState(inline);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! 👋 Sou o assistente do Escola Segura Report. Posso te ajudar a entender o que pode ser denunciado, como funciona o processo e tirar suas dúvidas antes de preencher o formulário. Como posso ajudar?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inline) setOpen(true);
  }, [inline]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);

    try {
      const resp = await supabase.functions.invoke("chatbot-denuncia", {
        body: { messages: allMessages },
      });

      if (resp.error) throw resp.error;
      const assistantContent = resp.data?.content || "Desculpe, não consegui processar sua pergunta. Tente novamente.";
      setMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Desculpe, houve um erro. Tente novamente em instantes." }]);
    } finally {
      setLoading(false);
    }
  };

  if (inline) {
    return (
      <div className="flex flex-col h-[450px] w-full bg-card rounded-2xl overflow-hidden">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-primary/[0.02]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-muted/80 text-foreground rounded-bl-none"
              }`}>
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <User className="h-4 w-4 text-secondary" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted/80 rounded-2xl rounded-bl-none px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick questions for inline mode */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-white border border-border px-4 py-2 rounded-full hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input & Action */}
        <div className="p-4 border-t border-border bg-card">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2 mb-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida aqui..."
              className="rounded-xl h-12 text-sm border-border/60 focus:ring-primary/20"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="h-12 w-12 rounded-xl shadow-lg shadow-primary/20">
              <Send className="h-5 w-5" />
            </Button>
          </form>
          {onStartForm && (
            <Button 
              variant="outline" 
              className="w-full h-11 rounded-xl border-primary/20 text-primary hover:bg-primary/5 gap-2 font-semibold"
              onClick={onStartForm}
            >
              Pronto para denunciar? Ir para o formulário <Send className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
            style={{ height: "480px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Assistente Escola Segura</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Online agora</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="h-6 w-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-3 w-3 text-secondary" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-none px-3 py-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick questions */}
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-full hover:bg-accent/80 transition-colors shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-card">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua dúvida..."
                  className="rounded-xl text-sm h-10"
                  disabled={loading}
                />
                <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-xl h-10 w-10 shadow-md">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      {!inline && (
        <motion.button
          onClick={() => setOpen(!open)}
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-primary/20"
          whileHover={{ rotate: 5 }}
          aria-label="Abrir chatbot"
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </motion.button>
      )}
    </>
  );
    </>
  );
};

export default DenunciaChatbot;
