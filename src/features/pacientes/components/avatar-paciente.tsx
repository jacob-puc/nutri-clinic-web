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

export function AvatarPaciente({ nombre, id, className }: AvatarPacienteProps) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full text-xs font-semibold select-none",
        "ring-1 ring-inset ring-black/5 dark:ring-white/10",
        TONES[tonoDesdeId(id)],
        className ?? "size-10",
      )}
      aria-hidden
      title={nombre}
    >
      {iniciales(nombre)}
    </span>
  );
}
