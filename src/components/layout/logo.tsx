import { Leaf } from "lucide-react";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

/**
 * Marca: una hoja cruzada con el degradado de la identidad. Se reconoce sin
 * depender del texto y funciona igual sobre la barra oscura que sobre
 * superficies claras.
 */
export function LogoNutriClinica({ className }: LogoProps) {
  return (
    <span
      className={cn(
        "gradient-brand grid place-items-center rounded-lg text-white shadow-subtle",
        className,
      )}
      aria-hidden
    >
      <Leaf className="size-5" strokeWidth={2.25} />
    </span>
  );
}

/** Marca con texto, para el encabezado movil donde no hay barra lateral. */
export function LogoConTexto({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoNutriClinica className="size-9 rounded-lg" />
      <span className="flex flex-col leading-none">
        <span className="text-foreground text-base font-bold tracking-tight">
          Nutri<span className="text-gradient-brand">Clinica</span>
        </span>
        <span className="text-muted-foreground mt-0.5 text-[11px] font-medium">
          Consulta nutricional
        </span>
      </span>
    </span>
  );
}
