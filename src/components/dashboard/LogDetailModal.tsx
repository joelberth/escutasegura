import { Monitor, Globe, MapPin, Clock, Shield, ExternalLink } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";

type Denuncia = Tables<"denuncias">;

interface LogDetailModalProps {
  log: Denuncia | null;
  open: boolean;
  onClose: () => void;
}

const tipoLabels: Record<string, string> = {
  bullying: "Bullying", estrutural: "Estrutural", comunicacao: "Comunicação", outro: "Outro",
};
const urgenciaLabels: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta" };

const LogDetailModal = ({ log, open, onClose }: LogDetailModalProps) => {
  const [showMap, setShowMap] = useState(false);

  if (!log) return null;

  const locationParts = log.location_info?.split(", ") || [];
  const hasLocation = log.location_info && log.location_info !== "Não disponível";
  const mapQuery = encodeURIComponent(log.location_info || "");

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Detalhes do Log
            </DialogTitle>
            <DialogDescription>{log.codigo_acompanhamento}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium">{tipoLabels[log.tipo] || log.tipo}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Urgência</p>
                <p className={`font-medium ${log.urgencia === "alta" ? "text-destructive" : ""}`}>
                  {urgenciaLabels[log.urgencia] || log.urgencia}
                </p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-xs text-muted-foreground">Escola</p>
                <p className="font-medium">{log.escola}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Data/Hora</p>
                <p className="font-medium">{new Date(log.created_at).toLocaleString("pt-BR")}</p>
              </div>
            </div>

            {/* Device Info */}
            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" /> Informações do Dispositivo
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Dispositivo: </span>
                  <span className="font-medium">{log.device_info || "Não disponível"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Endereço IP: </span>
                  <span className="font-mono text-xs font-medium">{log.ip_address || "Não disponível"}</span>
                </div>
              </div>
            </div>

            {/* Location Info */}
            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Localização
              </h4>
              <div className="text-sm">
                <span className="text-muted-foreground">Local: </span>
                <span className="font-medium">{log.location_info || "Não disponível"}</span>
              </div>
              {hasLocation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMap(true)}
                  className="gap-1.5 rounded-xl w-full"
                >
                  <MapPin className="h-3.5 w-3.5" /> Ver no Mapa
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Map Modal */}
      <Dialog open={showMap} onOpenChange={() => setShowMap(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Localização da Denúncia
            </DialogTitle>
            <DialogDescription>{log.location_info}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-border h-80">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                title="Localização"
              />
            </div>
            <div className="flex justify-end">
              <a
                href={`https://www.google.com/maps/search/${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir no Google Maps
                </Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LogDetailModal;
