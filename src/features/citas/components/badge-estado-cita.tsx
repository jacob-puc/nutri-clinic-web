import { Globe } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TooltipSimple } from "@/components/ui/tooltip-simple";
import {
  COLOR_ESTADO_CITA,
  ESTILO_ESTADO_CITA,
  ETIQUETA_ESTADO_CITA,
} from "@/features/citas/lib/estados-cita";
import { cn } from "@/lib/utils";
import type { CanalCita, EstadoCita } from "@/types/api";

export function BadgeEstadoCita({
  estado,
  className,
}: {
  estado: EstadoCita;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border-transparent pl-1.5", ESTILO_ESTADO_CITA[estado], className)}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", COLOR_ESTADO_CITA[estado])} />
      {ETIQUETA_ESTADO_CITA[estado]}
    </Badge>
  );
}

/** La reservo el paciente desde la pagina publica: hay que confirmarla con el. */
export function InsigniaEnLinea({ canal, className }: { canal: CanalCita | null | undefined; className?: string }) {
  if (canal !== "EnLinea") return null;
  return (
    <TooltipSimple contenido="Reservada por el paciente en línea">
      <Badge
        variant="outline"
        className={cn("bg-info-soft text-info-soft-foreground gap-1 border-transparent pl-1.5", className)}
      >
        <Globe className="size-3" aria-hidden />
        En línea
      </Badge>
    </TooltipSimple>
  );
}
