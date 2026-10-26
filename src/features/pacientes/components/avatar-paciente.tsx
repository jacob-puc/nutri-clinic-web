import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { TONES_AVATAR } from "@/lib/avatar-tonos";
import { iniciales, tonoDesdeId } from "@/lib/formatters";

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
          TONES_AVATAR[tonoDesdeId(id)],
        )}
      >
        {iniciales(nombre)}
      </AvatarFallback>
    </Avatar>
  );
}
