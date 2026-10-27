import { Badge } from "@/components/ui/badge";
import {
  COLOR_ESTADO_CITA,
  ESTILO_ESTADO_CITA,
  ETIQUETA_ESTADO_CITA,
} from "@/features/citas/lib/estados-cita";
import { cn } from "@/lib/utils";
import type { EstadoCita } from "@/types/api";

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
