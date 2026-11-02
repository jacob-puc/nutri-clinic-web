import { useMemo, useState } from "react";
import { AlertTriangle, ClipboardCheck, Copy, Loader2, Pencil, Play, Plus, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EncabezadoBloque } from "@/features/consultas/components/encabezado-bloque";
import { BadgeEstadoPlan, CaloriasVsObjetivo, LineaMacros } from "@/features/menus/components/comunes";
import { DialogoAsignarPlan } from "@/features/menus/components/dialogo-asignar-plan";
import { DialogoDuplicarPlan } from "@/features/menus/components/dialogo-duplicar-plan";
import { DialogoPlan } from "@/features/menus/components/dialogo-plan";
import { useActualizarMenuAsignado, useMenusAsignadosPorPaciente } from "@/features/menus/hooks/use-menus";
import {
  estimarRequerimiento,
  evaluarPlato,
  perfilDesdeHistorial,
} from "@/features/menus/lib/compatibilidad";
import {
  caloriasPorDia,
  DIAS_SEMANA,
  ETIQUETA_DIA,
  ETIQUETA_DIA_CORTA,
  ETIQUETA_TIEMPO,
  formatearKcal,
  formatearNumero,
  lineasADetallesDto,
  lineasDesdeDetalles,
  MACROS_CERO,
  promedioDiario,
  sumarMacros,
  TIEMPOS_COMIDA,
} from "@/features/menus/lib/menus";
import { usePaciente } from "@/features/pacientes/hooks/use-expediente";
import { mensajeDeError } from "@/lib/api-error";
import { abrirPdfConAviso } from "@/lib/pdf";
import { menusApi } from "@/features/menus/api/menus-api";
import { formatearFechaCorta } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { DiaSemana, Guid, HistorialClinico, MedidaAntropometrica, MenuAsignado } from "@/types/api";
import { hoyCalendario } from "@/lib/zona-horaria";

/* Date.getDay(): 0 es domingo. */
const DIA_DE_JS: DiaSemana[] = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

/**
 * El plan del paciente dentro de la consulta. Es donde se revisa como le fue
 * con el plan vigente y se ajusta, o donde se le da uno si no tiene.
 *
 * - Con plan: el menu de hoy, la semana contra su objetivo y los avisos de
 *   alergias. "Ajustar" abre el editor; "Cambiar" asigna otro y cierra este.
 * - Sin plan: asignar desde una plantilla (ordenadas por compatibilidad con
 *   su requerimiento estimado) o reutilizar un plan anterior. Al asignar se
 *   abre el editor para dejarlo a su medida en la misma consulta.
 */
export function SeccionPlanConsulta({
  pacienteId,
  medidaReferencia,
  historial,
  soloLectura,
}: {
  pacienteId: Guid;
  /** Medida mas reciente (la de hoy o la anterior): da peso y estatura. */
  medidaReferencia?: MedidaAntropometrica;
  historial?: HistorialClinico | null;
  soloLectura: boolean;
}) {
  const planes = useMenusAsignadosPorPaciente(pacienteId);
  const paciente = usePaciente(pacienteId);
  const activar = useActualizarMenuAsignado();

  const [editando, setEditando] = useState<MenuAsignado | null>(null);
  const [asignando, setAsignando] = useState(false);
  const [reutilizando, setReutilizando] = useState<MenuAsignado | null>(null);

  const ordenados = useMemo(
    () => [...(planes.data ?? [])].sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio)),
    [planes.data],
  );
  const vigente = ordenados.find((p) => p.estado === "Activo") ?? ordenados.find((p) => p.estado === "Borrador");
  const anterior = ordenados.find((p) => p.estado === "Finalizado");

  const requerimiento = estimarRequerimiento({
    sexo: paciente.data?.sexo,
    edad: paciente.data?.edad,
    peso: medidaReferencia?.peso,
    estatura: medidaReferencia?.estatura,
  });
  const perfil = perfilDesdeHistorial(historial);

  const activarPlan = (plan: MenuAsignado) =>
    activar.mutate(
      {
        menuId: plan.id,
        dto: {
          nombre: plan.nombre,
          descripcion: plan.descripcion,
          objetivoCalorico: plan.objetivoCalorico,
          fechaInicio: null,
          estado: "Activo",
          detalles: lineasADetallesDto(lineasDesdeDetalles(plan.detalles)),
        },
      },
      {
        onSuccess: () => toast.success("Plan activado", { description: plan.nombre }),
        onError: (error) => toast.error("No se pudo activar", { description: mensajeDeError(error) }),
      },
    );

  if (soloLectura && !vigente) return null;

  return (
    <section aria-labelledby="titulo-plan">
      <EncabezadoBloque id="titulo-plan" icono={ClipboardCheck} titulo="Plan nutricional" />

      <div className="mt-3">
        {planes.isPending ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : vigente ? (
          <TarjetaPlan
            plan={vigente}
            perfil={perfil}
            soloLectura={soloLectura}
            activando={activar.isPending}
            onAjustar={() => setEditando(vigente)}
            onCambiar={() => setAsignando(true)}
            onActivar={() => activarPlan(vigente)}
          />
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setAsignando(true)}
              className="border-muted-foreground/40 hover:border-primary/60 hover:bg-primary-soft/25 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
            >
              <span className="bg-primary-soft text-primary-soft-foreground grid size-10 place-items-center rounded-lg">
                <Plus className="size-5" aria-hidden />
              </span>
              <span>
                <span className="text-foreground block text-sm font-medium">Asignar plan nutricional</span>
                <span className="text-muted-foreground block text-xs">
                  {requerimiento
                    ? `Te mostramos primero las plantillas compatibles con su requerimiento estimado (≈${formatearKcal(requerimiento)}/día)`
                    : "Elige una plantilla semanal y ajústala a su medida"}
                </span>
              </span>
            </button>
            {anterior && (
              <p className="text-muted-foreground text-center text-xs">
                ¿Seguir con lo de antes?{" "}
                <button
                  type="button"
                  onClick={() => setReutilizando(anterior)}
                  className="text-primary inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
                >
                  <Copy className="size-3" aria-hidden />
                  Reutilizar «{anterior.nombre}»
                </button>
              </p>
            )}
          </div>
        )}
      </div>

      <DialogoPlan abierto={editando !== null} onOpenChange={(a) => !a && setEditando(null)} plan={editando} />
      <DialogoAsignarPlan
        abierto={asignando}
        onOpenChange={setAsignando}
        pacienteInicial={pacienteId}
        estadoInicial="Activo"
        requerimiento={requerimiento}
        planVigente={vigente}
        onAsignado={setEditando}
      />
      <DialogoDuplicarPlan
        plan={reutilizando}
        onOpenChange={(a) => !a && setReutilizando(null)}
        onDuplicado={setEditando}
      />
    </section>
  );
}

function TarjetaPlan({
  plan,
  perfil,
  soloLectura,
  activando,
  onAjustar,
  onCambiar,
  onActivar,
}: {
  plan: MenuAsignado;
  perfil: ReturnType<typeof perfilDesdeHistorial>;
  soloLectura: boolean;
  activando: boolean;
  onAjustar: () => void;
  onCambiar: () => void;
  onActivar: () => void;
}) {
  const hoy = DIA_DE_JS[hoyCalendario().getDay()]!;
  const porDia = caloriasPorDia(plan.detalles);
  const promedio = promedioDiario(plan.detalles);
  const maximo = Math.max(plan.objetivoCalorico ?? 0, ...Object.values(porDia), 1);

  const deHoy = plan.detalles.filter((d) => d.diaSemana === hoy).sort((a, b) => a.orden - b.orden);
  const diasConPlatos = DIAS_SEMANA.filter((d) => porDia[d] > 0).length || 1;
  const macrosPromedio = plan.detalles.reduce((s, d) => sumarMacros(s, d, 1 / diasConPlatos), MACROS_CERO);

  /* Aviso de alergias: por nombre del plato, que es lo que trae el plan. */
  const conAlergenos = perfil
    ? [
        ...new Set(
          plan.detalles.flatMap((d) => evaluarPlato({ nombre: d.platoNombre, detalles: [] }, perfil).alergenos),
        ),
      ]
    : [];

  return (
    <div className="hoja rounded-xl">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-foreground font-semibold">{plan.nombre}</p>
            <BadgeEstadoPlan estado={plan.estado} />
          </div>
          <p className="text-muted-foreground text-xs">
            Desde el {formatearFechaCorta(plan.fechaInicio)}
            {plan.plantillaMenuNombre && ` · basado en ${plan.plantillaMenuNombre}`}
          </p>
        </div>
        {/* Imprimir siempre esta disponible, tambien con la consulta cerrada:
            el menu se entrega al paciente al final de la atencion o despues. */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => abrirPdfConAviso(() => menusApi.abrirMenuPdf(plan.id))}>
            <Printer className="size-4" />
            Imprimir menú
          </Button>
          {!soloLectura && (
          <>
            {plan.estado === "Borrador" && (
              <Button size="sm" onClick={onActivar} disabled={activando}>
                {activando ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                Activar
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onAjustar}>
              <Pencil className="size-4" />
              Ajustar plan
            </Button>
            <Button size="sm" variant="ghost" onClick={onCambiar}>
              <RefreshCw className="size-4" />
              Cambiar
            </Button>
          </>
          )}
        </div>
      </div>

      {plan.estado === "Borrador" && !soloLectura && (
        <p className="bg-warning-soft text-warning-soft-foreground border-border border-t border-dashed px-4 py-2 text-xs md:px-5">
          Está en borrador: el paciente todavía no lo sigue. Ajústalo y actívalo cuando esté listo.
        </p>
      )}

      {conAlergenos.length > 0 && (
        <p className="bg-destructive-soft text-destructive-soft-foreground border-border flex items-center gap-1.5 border-t border-dashed px-4 py-2 text-xs font-medium md:px-5">
          <AlertTriangle className="size-3.5" aria-hidden />
          Hay platos que podrían contener {conAlergenos.join(", ")}, alergia registrada del paciente.
        </p>
      )}

      <div className="border-border grid gap-x-8 gap-y-5 border-t border-dashed px-4 py-4 md:grid-cols-2 md:px-5">
        {/* ---------- Menu de hoy ---------- */}
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Hoy · {ETIQUETA_DIA[hoy]}
          </p>
          {deHoy.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">Este día no tiene platos en el plan.</p>
          ) : (
            <dl className="mt-2 space-y-1.5">
              {TIEMPOS_COMIDA.filter((t) => deHoy.some((d) => d.tiempoComida === t)).map((tiempo) => (
                <div key={tiempo} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 text-sm">
                  <dt className="text-muted-foreground">{ETIQUETA_TIEMPO[tiempo]}</dt>
                  <dd className="text-foreground min-w-0">
                    {deHoy
                      .filter((d) => d.tiempoComida === tiempo)
                      .map((d) => (d.cantidad === 1 ? d.platoNombre : `${d.platoNombre} ×${formatearNumero(d.cantidad)}`))
                      .join(" · ")}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* ---------- Semana contra el objetivo ---------- */}
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Promedio diario</p>
              <div className="mt-1">
                <CaloriasVsObjetivo calorias={promedio} objetivo={plan.objetivoCalorico} />
              </div>
            </div>
            <LineaMacros macros={macrosPromedio} conBarra />
          </div>

          <div className="mt-3 grid h-20 grid-cols-7 items-end gap-1.5" aria-label="Calorías por día">
            {DIAS_SEMANA.map((dia) => {
              const kcal = porDia[dia];
              const fuera =
                plan.objetivoCalorico && kcal > 0 && Math.abs(kcal - plan.objetivoCalorico) / plan.objetivoCalorico > 0.1;
              return (
                <div key={dia} className="flex h-full flex-col items-center justify-end gap-1">
                  <span
                    className={cn(
                      "w-full rounded-t-md",
                      kcal === 0 ? "bg-muted h-1" : fuera ? "bg-[var(--warning)]" : "bg-primary/70",
                      dia === hoy && kcal > 0 && "bg-primary",
                    )}
                    style={kcal > 0 ? { height: `${Math.max(8, (kcal / maximo) * 100)}%` } : undefined}
                    aria-label={`${ETIQUETA_DIA[dia]}: ${formatearKcal(kcal)}`}
                  />
                  <span
                    className={cn("text-[10px]", dia === hoy ? "text-foreground font-semibold" : "text-muted-foreground")}
                  >
                    {ETIQUETA_DIA_CORTA[dia]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
