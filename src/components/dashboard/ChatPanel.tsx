import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatPanelProps {
  denunciaId: string;
  denunciaCodigo: string;
  userId: string;
  senderName: string;
}

const ChatPanel = ({ denunciaId, denunciaCodigo, userId, senderName }: ChatPanelProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("denuncia_id", denunciaId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-${denunciaId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `denuncia_id=eq.${denunciaId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [denunciaId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      denuncia_id: denunciaId,
      user_id: userId,
      sender_name: senderName,
      message: text,
    });
    if (error) {
      toast({ title: "Erro ao enviar mensagem", variant: "destructive" });
    }
    setNewMessage("");
    setSending(false);
  };

  return (
    <div className="flex flex-col h-80">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <MessageCircle className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Chat — {denunciaCodigo}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhuma mensagem ainda. Inicie a conversa.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.user_id === userId ? "items-end" : "items-start"}`}
          >
            <span className="text-[10px] text-muted-foreground mb-0.5">{msg.sender_name}</span>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
              msg.user_id === userId
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}>
              {msg.message}
            </div>
            <span className="text-[9px] text-muted-foreground mt-0.5">
              {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 mt-3 pt-2 border-t border-border">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="rounded-xl text-sm"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        />
        <Button size="icon" onClick={handleSend} disabled={sending} className="rounded-xl shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;
