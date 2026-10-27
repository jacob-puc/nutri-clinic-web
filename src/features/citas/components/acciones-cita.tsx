import { useState } from "react";
import { Check, ChevronDown, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DialogoCancelarCita } from "@/features/citas/components/dialogo-cancelar-cita";
import { useCambiarEstadoCita } from "@/features/citas/hooks/use-mutaciones-cita";
import { useIniciarAtencion } from "@/features/consultas/hooks/use-iniciar-atencion";
import {
  ETIQUETA_ACCION_CITA,
  esAccionDestructiva,
  TRANSICIONES_CITA,
} from "@/features/citas/lib/estados-cita";
import { mensajeDeError } from "@/lib/api-error";
import { toast } from "sonner";
import type { Cita, EstadoCita } from "@/types/api";

/**
 * Solo ofrece las transiciones que el backend acepta desde el estado actual.
 * Cancelada pide motivo en su propio dialogo; el resto se aplica directo.
 * `EnCurso` no es un cambio de estado suelto: crea la consulta y abre su
 * espacio de trabajo, asi que se intercepta.
 */
export function AccionesCita({ cita, compacto = false }: { cita: Cita; compacto?: boolean }) {
  const cambiar = useCambiarEstadoCita(cita.id);
  const atencion = useIniciarAtencion(cita);
  const [cancelando, setCancelando] = useState(false);

  const transiciones = TRANSICIONES_CITA[cita.estado] ?? [];

  if (transiciones.length === 0) return null;

  const aplicar = (estado: EstadoCita) => {
    cambiar.mutate(
      { estado },
      {
        onError: (error: unknown) =>
          toast.error("No se pudo cambiar el estado", {
            description: mensajeDeError(error),
          }),
      },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={compacto ? "icon" : "sm"}
            className={compacto ? "size-8" : "gap-1.5"}
          >
            <span className={compacto ? "sr-only" : undefined}>Cambiar estado</span>
            <ChevronDown
              className={compacto ? "size-4" : "size-3.5 opacity-70"}
              aria-hidden
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-muted-foreground text-xs">
            Pasar a
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {transiciones.map((estado) => {
            const destructiva = esAccionDestructiva(estado);
            const Icono = estado === "Cancelada" ? XCircle : Check;

            return (
              <DropdownMenuItem
                key={estado}
                variant={destructiva ? "destructive" : "default"}
                disabled={cambiar.isPending || atencion.pendiente}
                onSelect={() => {
                  if (estado === "Cancelada") {
                    setCancelando(true);
                    return;
                  }
                  // Iniciar la atención crea la consulta, no solo cambia estado.
                  if (estado === "EnCurso") {
                    atencion.iniciar();
                    return;
                  }
                  aplicar(estado);
                }}
              >
                <Icono aria-hidden />
                {ETIQUETA_ACCION_CITA[estado]}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogoCancelarCita
        abierto={cancelando}
        onOpenChange={setCancelando}
        citaId={cita.id}
      />
    </>
  );
}

/** Avance y excepciones de cada estado, espejo de `TransicionesPermitidas`. */
const BOTONES_ESTADO: Record<
  EstadoCita,
  Array<{ estado: EstadoCita; etiqueta: string; principal?: boolean }>
> = {
  // Sin confirmar aun: se avanza o se cancela; no se marca ausencia.
  Programada: [
    { estado: "Confirmada", etiqueta: "Confirmar", principal: true },
    { estado: "Cancelada", etiqueta: "Cancelar" },
  ],
  // Confirmada: hay compromiso, asi que aparece la ausencia y no el cancelado.
  Confirmada: [
    { estado: "EnCurso", etiqueta: "Iniciar", principal: true },
    { estado: "NoAsistio", etiqueta: "No asistio" },
  ],
  EnCurso: [
    { estado: "NoAsistio", etiqueta: "No asistio", principal: true },
    { estado: "Cancelada", etiqueta: "Cancelar" },
  ],
  NoAsistio: [
    { estado: "Programada", etiqueta: "Reabrir", principal: true },
    { estado: "Cancelada", etiqueta: "Cancelar" },
  ],
  Cancelada: [],
  Completada: [],
};

/**
 * Acciones directas para el dia a dia, sin menu desplegable: el siguiente
 * estado como boton principal y la excepcion al lado. Cancelar pide motivo.
 * El boton "Iniciar" de una cita confirmada crea la consulta (EnCurso).
 */
export function BotonesEstadoCita({ cita }: { cita: Cita }) {
  const cambiar = useCambiarEstadoCita(cita.id);
  const atencion = useIniciarAtencion(cita);
  const [cancelando, setCancelando] = useState(false);

  const botones = BOTONES_ESTADO[cita.estado] ?? [];
  if (botones.length === 0) return null;

  const aplicar = (estado: EstadoCita) => {
    cambiar.mutate(
      { estado },
      {
        onError: (error: unknown) =>
          toast.error("No se pudo cambiar el estado", {
            description: mensajeDeError(error),
          }),
      },
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {botones.map(({ estado, etiqueta, principal }) => {
          const destructiva = esAccionDestructiva(estado);
          const esInicio = estado === "EnCurso";
          const ocupado = esInicio ? atencion.pendiente : cambiar.isPending;
          return (
            <Button
              key={estado}
              type="button"
              size="sm"
              variant={principal ? (destructiva ? "destructive" : "default") : "outline"}
              disabled={ocupado}
              className={
                !principal && destructiva
                  ? "text-destructive border-destructive/30 hover:bg-destructive/10"
                  : undefined
              }
              onClick={() => {
                if (estado === "Cancelada") {
                  setCancelando(true);
                  return;
                }
                if (esInicio) {
                  atencion.iniciar();
                  return;
                }
                aplicar(estado);
              }}
            >
              {ocupado && <Loader2 className="size-4 animate-spin" />}
              {etiqueta}
            </Button>
          );
        })}
      </div>

      <DialogoCancelarCita
        abierto={cancelando}
        onOpenChange={setCancelando}
        citaId={cita.id}
      />
    </>
  );
}
