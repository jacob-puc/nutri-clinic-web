import { cn } from "@/lib/utils";

const FORMATO_MES = new Intl.DateTimeFormat("es-MX", { month: "short" });

/**
 * Hoja de calendario de escritorio: franja de color con el mes y el dia en
 * grande debajo. Sustituye a la teja de icono generica en los bloques de cita,
 * porque la fecha es justo lo que el nutricionista busca de un vistazo.
 */
export function HojaCalendario({
  fecha,
  tamano = "md",
  className,
}: {
  fecha: Date;
  tamano?: "md" | "lg";
  className?: string;
}) {
  const mes = FORMATO_MES.format(fecha).replace(".", "");

  return (
    <div
      aria-hidden
      className={cn(
        "hoja flex shrink-0 flex-col overflow-hidden rounded-lg text-center",
        tamano === "lg" ? "w-16" : "w-12",
        className,
      )}
    >
      <span
        className={cn(
          "bg-primary text-primary-foreground font-semibold capitalize leading-none",
          tamano === "lg" ? "py-1.5 text-xs" : "py-1 text-[10px]",
        )}
      >
        {mes}
      </span>
      <span
        className={cn(
          "text-foreground font-semibold tracking-tight tabular-nums leading-none",
          tamano === "lg" ? "py-2.5 text-2xl" : "py-1.5 text-lg",
        )}
      >
        {fecha.getDate()}
      </span>
    </div>
  );
}
