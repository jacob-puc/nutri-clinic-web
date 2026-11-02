import type { LucideIcon } from "lucide-react";

/** Titulo de bloque dentro del espacio de trabajo: texto e icono, sin caja. */
export function EncabezadoBloque({
  id,
  icono: Icono,
  titulo,
  conteo,
  opcional = false,
}: {
  id: string;
  icono: LucideIcon;
  titulo: string;
  conteo?: number;
  opcional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icono className="text-muted-foreground size-4" aria-hidden />
      <h2 id={id} className="text-foreground text-sm font-semibold">
        {titulo}
      </h2>
      {conteo !== undefined && conteo > 0 && (
        <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
          {conteo}
        </span>
      )}
      {opcional && <span className="text-muted-foreground-subtle text-xs">Opcional</span>}
    </div>
  );
}
