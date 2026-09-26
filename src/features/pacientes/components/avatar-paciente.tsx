import { cn } from "@/lib/utils";
import { iniciales, tonoDesdeId } from "@/lib/formatters";

const TONES = [
  "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
  "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  "bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
] as const;

interface AvatarPacienteProps {
  nombre: string;
  /** Se usa para derivar un color estable por paciente. */
  id: string;
  className?: string;
}

/**
 * Avatar con iniciales. No se usa una foto: el backend todavia no expone
 * imagen de paciente y un avatar de texto es honesto, mientras que una
 * silueta gris repetida en 200 filas se lee como un bug.
 */
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
