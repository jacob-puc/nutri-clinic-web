import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TramoBreadcrumbs {
  etiqueta: string;
  /**
   * Omítelo en el tramo final: el destino actual no se enlaza a sí mismo.
   */
  href?: string;
}

interface BreadcrumbsProps {
  tramos: TramoBreadcrumbs[];
  /** Nombre del `nav` para lectores de pantalla. */
  etiquetaNav?: string;
  className?: string;
}

/**
 * Miga de pan. El tramo final se dibuja como una pastilla teñida del color
 * primario y se marca como página actual, así se distingue de un enlace de un
 * vistazo.
 *
 * No hay componente equivalente en shadcn: el de la librería oficial es de
 * documentación, no de aplicación. Se construye a mano con el lenguaje visual
 * de la app.
 */
export function Breadcrumbs({
  tramos,
  etiquetaNav = "Miga de pan",
  className,
}: BreadcrumbsProps) {
  if (tramos.length === 0) return null;

  return (
    <nav aria-label={etiquetaNav} className={cn("min-w-0", className)}>
      <ol className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
        {tramos.map((tramo, indice) => {
          const esUltimo = indice === tramos.length - 1;

          return (
            <Fragment key={`${tramo.etiqueta}-${indice}`}>
              {indice > 0 && (
                <li
                  aria-hidden="true"
                  className="text-muted-foreground-subtle shrink-0"
                >
                  <ChevronRight className="size-4" />
                </li>
              )}
              <li className={cn("min-w-0", !esUltimo && "shrink-0")}>
                {tramo.href && !esUltimo ? (
                  <Link
                    to={tramo.href}
                    className="rounded-sm px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {tramo.etiqueta}
                  </Link>
                ) : (
                  <span
                    aria-current={esUltimo ? "page" : undefined}
                    className="bg-primary/10 text-primary border-primary/20 block min-w-0 truncate rounded-md border px-2.5 py-1 font-semibold"
                  >
                    {tramo.etiqueta}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
