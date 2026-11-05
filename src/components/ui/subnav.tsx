import { Info, type LucideIcon } from "lucide-react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { TooltipSimple } from "@/components/ui/tooltip-simple";

export interface OpcionSubnav {
  valor: string;
  etiqueta: string;
  icono: LucideIcon;
  /** Conteo junto a la etiqueta; en 0 o sin definir no se muestra. */
  insignia?: number;
}

/**
 * Encabezado y navegacion de una seccion en una sola barra, fija bajo la barra
 * superior: el titulo a la izquierda y las opciones centradas. Va dentro de
 * `Tabs`, que sigue controlando la vista activa.
 *
 * En pantallas chicas el titulo se oculta (el menu ya dice donde estas) y las
 * opciones se deslizan de lado si no caben.
 */
export function Subnav({
  titulo,
  subtitulo,
  ayuda,
  opciones,
}: {
  titulo: string;
  /** Dato breve bajo el titulo, como la fecha del dia. */
  subtitulo?: string;
  /** Explicacion de la seccion: va en el tooltip del icono de informacion. */
  ayuda?: string;
  opciones: OpcionSubnav[];
}) {
  return (
    <div className="bg-background/85 supports-[backdrop-filter]:bg-background/65 sticky top-0 z-20 backdrop-blur-md">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-x-4 px-4 py-2.5 md:px-8 lg:grid-cols-[1fr_auto_1fr]">
        <div className="sr-only flex items-center gap-1.5 lg:not-sr-only lg:flex">
          <div>
            <h1 className="text-foreground text-xl font-semibold tracking-tight whitespace-nowrap">{titulo}</h1>
            {subtitulo && (
              <p className="text-muted-foreground text-xs whitespace-nowrap first-letter:uppercase">{subtitulo}</p>
            )}
          </div>
          {ayuda && (
            <TooltipSimple contenido={ayuda} side="bottom" className="max-w-xs">
              <button
                type="button"
                aria-label={`Qué es ${titulo}`}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring grid size-6 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2"
              >
                <Info className="size-3.5" aria-hidden />
              </button>
            </TooltipSimple>
          )}
        </div>

        <div className="min-w-0 overflow-x-auto">
          {/* mx-auto + w-max: centra sin recortar la primera opcion cuando desborda. */}
          <TabsPrimitive.List aria-label={titulo} className="mx-auto flex w-max items-center gap-1.5 p-0.5">
            {opciones.map(({ valor, etiqueta, icono: Icono, insignia }) => (
              <TabsPrimitive.Trigger
                key={valor}
                value={valor}
                className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 data-[state=active]:bg-muted data-[state=active]:text-foreground inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px]"
              >
                <Icono className="size-4 shrink-0" aria-hidden />
                {etiqueta}
                {insignia ? (
                  <span className="bg-primary/12 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                    {insignia}
                  </span>
                ) : null}
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>
        </div>
      </div>
    </div>
  );
}
