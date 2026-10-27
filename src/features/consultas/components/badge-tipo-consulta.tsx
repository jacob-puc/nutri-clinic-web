import { Badge } from "@/components/ui/badge";
import {
  ESTILO_TIPO_CONSULTA,
  ETIQUETA_TIPO_CONSULTA,
} from "@/features/consultas/lib/etiquetas-consulta";
import { cn } from "@/lib/utils";
import type { TipoConsulta } from "@/types/api";

export function BadgeTipoConsulta({
  tipo,
  className,
}: {
  tipo: TipoConsulta;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        ESTILO_TIPO_CONSULTA[tipo],
        className,
      )}
    >
      {ETIQUETA_TIPO_CONSULTA[tipo]}
    </Badge>
  );
}
