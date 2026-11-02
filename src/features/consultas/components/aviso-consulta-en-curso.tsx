import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatearHoraLocal } from "@/features/citas/lib/fechas-cita";
import { useConsultasAbiertas } from "@/features/consultas/hooks/use-consultas";

/**
 * Franja fija arriba del contenido mientras haya una consulta sin cerrar.
 * Salir de la consulta (ir a la agenda, al expediente) ya no la pierde: desde
 * cualquier pantalla queda a un clic volver a ella.
 *
 * No se muestra dentro de la propia consulta ni en la cola del día, que ya
 * tiene su seccion "En curso".
 */
export function AvisoConsultaEnCurso() {
  const { pathname } = useLocation();
  const { data } = useConsultasAbiertas();

  const abiertas = (data ?? [])
    .filter((c) => pathname !== `/consultas/${c.id}`)
    .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));

  const [principal, ...resto] = abiertas;
  if (pathname === "/consultas" || !principal) return null;

  return (
    <div className="bg-warning-soft text-warning-soft-foreground border-warning/30 sticky top-0 z-20 border-b">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 md:px-8">
        <span className="relative flex size-2.5 shrink-0" aria-hidden>
          <span className="bg-warning absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none" />
          <span className="bg-warning relative inline-flex size-2.5 rounded-full" />
        </span>
        <Stethoscope className="size-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">Consulta en curso</span> con {principal.pacienteNombre} · desde las{" "}
          {formatearHoraLocal(principal.fechaInicio)}
          {resto.length > 0 && (
            <>
              {" · "}
              <Link to="/consultas" className="underline underline-offset-2">
                {resto.length === 1 ? "1 más abierta" : `${resto.length} más abiertas`}
              </Link>
            </>
          )}
        </p>
        <Button size="sm" asChild className="h-8">
          <Link to={`/consultas/${principal.id}`}>
            Continuar
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
