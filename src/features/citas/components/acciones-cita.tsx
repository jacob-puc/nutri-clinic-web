import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermisos } from "@/features/auth/hooks/use-permisos";
import { DialogoCancelarCita } from "@/features/citas/components/dialogo-cancelar-cita";
import { useCambiarEstadoCita } from "@/features/citas/hooks/use-mutaciones-cita";
import { useConsultaPorCita } from "@/features/consultas/hooks/use-consultas";
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
  /* Recepcion mueve estados, pero iniciar o continuar la consulta es clinico. */
  const { atiende } = usePermisos();

  const transiciones = (TRANSICIONES_CITA[cita.estado] ?? []).filter((e) => atiende || e !== "EnCurso");

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
      {atiende && cita.estado === "EnCurso" && <BotonContinuarConsulta citaId={cita.id} />}
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
  /* La accion principal de una cita en curso es "Continuar consulta"
     (BotonContinuarConsulta); aqui solo quedan las excepciones. */
  EnCurso: [
    { estado: "NoAsistio", etiqueta: "No asistio" },
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
  const { atiende } = usePermisos();

  const botones = (BOTONES_ESTADO[cita.estado] ?? []).filter((b) => atiende || b.estado !== "EnCurso");
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
        {atiende && cita.estado === "EnCurso" && <BotonContinuarConsulta citaId={cita.id} />}
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

/**
 * Vuelve a la consulta abierta de una cita en curso. Sin esto, la unica
 * salida desde la cita era "Iniciar" de nuevo, que el backend rechaza porque
 * la consulta ya existe.
 */
function BotonContinuarConsulta({ citaId }: { citaId: string }) {
  const { data: consulta, isPending } = useConsultaPorCita(citaId);

  if (isPending) {
    return (
      <Button size="sm" disabled>
        <Loader2 className="size-4 animate-spin" />
        Continuar consulta
      </Button>
    );
  }
  if (!consulta) return null;

  return (
    <Button size="sm" asChild>
      <Link to={`/consultas/${consulta.id}`}>
        Continuar consulta
        <ArrowRight className="size-4" />
      </Link>
    </Button>
  );
}
