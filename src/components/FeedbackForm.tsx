import { useState } from "react";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Props {
  denunciaId: string;
}

const FeedbackForm = ({ denunciaId }: Props) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Selecione uma avaliação", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("denuncia_feedback" as any).insert({
      denuncia_id: denunciaId,
      rating,
      comment: comment.trim() || null,
    } as any);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Você já avaliou esta denúncia" });
      } else {
        toast({ title: "Erro ao enviar avaliação", variant: "destructive" });
      }
    } else {
      setSubmitted(true);
      toast({ title: "Obrigado pela avaliação! ⭐" });
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center"
      >
        <p className="text-sm font-medium text-primary">✅ Obrigado pelo feedback!</p>
        <p className="text-xs text-muted-foreground mt-1">Sua avaliação ajuda a melhorar o atendimento.</p>
      </motion.div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      <p className="text-sm font-medium">Avalie o atendimento</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                star <= (hover || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Deixe um comentário (opcional)..."
        rows={2}
        className="text-sm"
      />
      <Button size="sm" onClick={handleSubmit} disabled={loading} className="gap-1.5">
        <Send className="h-3.5 w-3.5" /> {loading ? "Enviando..." : "Enviar Avaliação"}
      </Button>
    </div>
  );
};

export default FeedbackForm;
