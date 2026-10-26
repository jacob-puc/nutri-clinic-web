import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { iniciales, tonoDesdeId } from "@/lib/formatters";

/* Tonos del avatar tomados del sistema semantico en vez de la paleta cruda de
   Tailwind: asi el avatar se re-colorea con la tema y los seis pares ya estan
   verificados a 4.5:1 en claro y en oscuro. */
const TONES = [
  "bg-primary-soft text-primary-soft-foreground",
  "bg-accent-soft text-accent-soft-foreground",
  "bg-success-soft text-success-soft-foreground",
  "bg-info-soft text-info-soft-foreground",
  "bg-warning-soft text-warning-soft-foreground",
  "bg-secondary text-secondary-foreground",
] as const;

interface AvatarPacienteProps {
  nombre: string;
  id: string;
  className?: string;
}

/**
 * Avatar con iniciales, sobre las primitivas de shadcn. Conserva su propia
 * lógica de color porque viene del sistema semántico, no de la paleta cruda:
 * el anillo y los tonos son responsabilidad de esta capa, no de `ui/avatar`.
 */
export function AvatarPaciente({ nombre, id, className }: AvatarPacienteProps) {
  return (
    /* Sin title ni tooltip: el nombre del paciente se pinta siempre junto al
       avatar, y en el estado de catalogo vacio seria "Paciente". Es decorativo
       y por eso va oculto para lectores de pantalla. */
    <Avatar
      aria-hidden
      className={cn(
        "ring-1 ring-inset ring-black/5 dark:ring-white/10",
        className ?? "size-10",
      )}
    >
      <AvatarFallback
        className={cn(
          "text-xs font-semibold select-none",
          TONES[tonoDesdeId(id)],
        )}
      >
        {iniciales(nombre)}
      </AvatarFallback>
    </Avatar>
  );
}
