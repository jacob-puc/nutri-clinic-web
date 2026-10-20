import { Badge } from "@/components/ui/badge";
import { ESTILO_ESTADO_CITA, ETIQUETA_ESTADO_CITA } from "@/features/citas/lib/estados-cita";
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
    <Badge variant="outline" className={cn(ESTILO_ESTADO_CITA[estado], className)}>
      {ETIQUETA_ESTADO_CITA[estado]}
    </Badge>
  );
}
