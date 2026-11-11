import { useMemo, useState } from "react";
import { AlertTriangle, ClipboardCheck, Copy, Loader2, MoreHorizontal, Pencil, Play, Plus, Printer, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EncabezadoBloque } from "@/features/consultas/components/encabezado-bloque";
import { BadgeEstadoPlan, LineaMacros, MedidorCalorias, TOLERANCIA_OBJETIVO } from "@/features/menus/components/comunes";
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
  avanceDelPlan,
  caloriasPorDia,
  DIAS_SEMANA,
  ETIQUETA_DIA,
  ETIQUETA_DIA_CORTA,
  ETIQUETA_TIEMPO,
  formatearKcal,
  formatearNumero,
  indiceDiaSemana,
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
import type { DiaSemana, Guid, HistorialClinico, MedidaAntropometrica, MenuAsignado, MenuAsignadoEstado } from "@/types/api";
import { hoyEnClinica } from "@/lib/zona-horaria";

/**
 * El plan del paciente dentro de la consulta. Es donde se revisa como le fue
 * con el plan vigente y se ajusta, o donde se le da uno si no tiene.
 *
 * - Con plan: la semana contra su objetivo, el menu del dia elegido y los
 *   avisos de alergias. "Ajustar" abre el editor; "Cambiar" asigna otro y
 *   cierra este; "Quitar" lo finaliza: el paciente se queda sin plan, pero el
 *   plan no se borra y se puede reutilizar.
 * - Sin plan: asignar desde una plantilla (ordenadas por compatibilidad con
 *   su requerimiento estimado) o reutilizar un plan anterior. Al asignar se
 *   abre el editor para dejarlo a su medida en la misma consulta.
 */
export function SeccionPlanConsulta({
  pacienteId,
  medidaReferencia,
  historial,
  soloLectura,
  titulo = "Plan nutricional",
}: {
  pacienteId: Guid;
  /** Medida mas reciente (la de hoy o la anterior): da peso y estatura. */
  medidaReferencia?: MedidaAntropometrica;
  historial?: HistorialClinico | null;
  soloLectura: boolean;
  titulo?: string;
}) {
  const planes = useMenusAsignadosPorPaciente(pacienteId);
  const paciente = usePaciente(pacienteId);
  const actualizar = useActualizarMenuAsignado();

  const [editando, setEditando] = useState<MenuAsignado | null>(null);
  const [asignando, setAsignando] = useState(false);
  const [reutilizando, setReutilizando] = useState<MenuAsignado | null>(null);
  const [quitando, setQuitando] = useState<MenuAsignado | null>(null);

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

  const cambiarEstado = (plan: MenuAsignado, estado: MenuAsignadoEstado, exito: string, fallo: string) =>
    actualizar.mutate(
      {
        menuId: plan.id,
        dto: {
          nombre: plan.nombre,
          descripcion: plan.descripcion,
          objetivoCalorico: plan.objetivoCalorico,
          fechaInicio: null,
          estado,
          detalles: lineasADetallesDto(lineasDesdeDetalles(plan.detalles)),
        },
      },
      {
        onSuccess: () => {
          toast.success(exito, { description: plan.nombre });
          setQuitando(null);
        },
        onError: (error) => toast.error(fallo, { description: mensajeDeError(error) }),
      },
    );

  if (soloLectura && !vigente) return null;

  return (
    <section aria-labelledby="titulo-plan">
      <EncabezadoBloque id="titulo-plan" icono={ClipboardCheck} titulo={titulo} />

      <div className="mt-3">
        {planes.isPending ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : vigente ? (
          <TarjetaPlan
            plan={vigente}
            perfil={perfil}
            soloLectura={soloLectura}
            activando={actualizar.isPending}
            onAjustar={() => setEditando(vigente)}
            onCambiar={() => setAsignando(true)}
            onQuitar={() => setQuitando(vigente)}
            onActivar={() => cambiarEstado(vigente, "Activo", "Plan activado", "No se pudo activar")}
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

      <AlertDialog open={quitando !== null} onOpenChange={(a) => !a && setQuitando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar «{quitando?.nombre}» del paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              El paciente se queda sin este plan. No se borra: pasa a Finalizados y podrás reutilizarlo cuando quieras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actualizar.isPending}>Volver</AlertDialogCancel>
            <AlertDialogAction
              disabled={actualizar.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (quitando) cambiarEstado(quitando, "Finalizado", "Plan quitado", "No se pudo quitar el plan");
              }}
            >
              {actualizar.isPending ? "Quitando..." : "Quitar plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  onQuitar,
  onActivar,
}: {
  plan: MenuAsignado;
  perfil: ReturnType<typeof perfilDesdeHistorial>;
  soloLectura: boolean;
  activando: boolean;
  onAjustar: () => void;
  onCambiar: () => void;
  onQuitar: () => void;
  onActivar: () => void;
}) {
  const claveHoy = hoyEnClinica();
  const hoy = DIAS_SEMANA[indiceDiaSemana(claveHoy)]!;
  const [diaElegido, setDiaElegido] = useState<DiaSemana>(hoy);

  const porDia = caloriasPorDia(plan.detalles);
  const promedio = promedioDiario(plan.detalles);
  const maximo = Math.max(plan.objetivoCalorico ?? 0, ...Object.values(porDia), 1);
  const avance = plan.estado === "Activo" ? avanceDelPlan(plan.fechaInicio, claveHoy) : null;

  const delDia = plan.detalles.filter((d) => d.diaSemana === diaElegido).sort((a, b) => a.orden - b.orden);
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
    <div className="hoja rounded-[1.25rem]">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-foreground font-semibold">{plan.nombre}</p>
            <BadgeEstadoPlan estado={plan.estado} />
          </div>
          <p className="text-muted-foreground text-xs">
            {avance ? `Semana ${avance.semana} · día ${avance.dia} de 7` : `Desde el ${formatearFechaCorta(plan.fechaInicio)}`}
            {plan.plantillaMenuNombre && ` · basado en ${plan.plantillaMenuNombre}`}
          </p>
        </div>
        {/* Imprimir siempre esta disponible, tambien con la consulta cerrada:
            el menu se entrega al paciente al final de la atencion o despues. */}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => abrirPdfConAviso(() => menusApi.abrirMenuPdf(plan.id))}>
            <Printer className="size-4" />
            Imprimir
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label="Más acciones del plan">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={onCambiar}>
                  <RefreshCw />
                  Cambiar plan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onQuitar}>
                  <X />
                  Quitar plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

      <div className="border-border space-y-5 border-t border-dashed px-4 py-4 md:px-5">
        {/* ---------- Promedio de la semana ---------- */}
        <div className="grid items-center gap-x-8 gap-y-3 md:grid-cols-[65fr_35fr]">
          <MedidorCalorias calorias={promedio} objetivo={plan.objetivoCalorico} grueso />
          <LineaMacros macros={macrosPromedio} conBarra grueso />
        </div>

        {/* ---------- Semana: cada dia abre su menu ---------- */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="group" aria-label="Días de la semana del plan">
          {DIAS_SEMANA.map((dia) => {
            const kcal = porDia[dia];
            const fuera =
              Boolean(plan.objetivoCalorico) &&
              kcal > 0 &&
              Math.abs(kcal - plan.objetivoCalorico!) / plan.objetivoCalorico! > TOLERANCIA_OBJETIVO;
            const elegido = dia === diaElegido;
            return (
              <button
                key={dia}
                type="button"
                aria-pressed={elegido}
                aria-label={`${ETIQUETA_DIA[dia]}${dia === hoy ? " (hoy)" : ""}: ${kcal > 0 ? formatearKcal(kcal) : "sin platos"}`}
                onClick={() => setDiaElegido(dia)}
                className={cn(
                  "focus-visible:ring-ring/50 flex min-w-0 cursor-pointer flex-col items-center gap-1.5 rounded-xl px-1 pt-3 pb-2.5 transition-colors outline-none focus-visible:ring-[3px]",
                  elegido ? "bg-muted" : "hover:bg-accent",
                )}
              >
                <span
                  className={cn(
                    "text-sm",
                    dia === hoy ? "text-primary font-semibold" : "text-muted-foreground font-medium",
                  )}
                >
                  {ETIQUETA_DIA_CORTA[dia]}
                </span>
                <span className="flex h-16 w-full max-w-12 items-end">
                  <span
                    className={cn(
                      "columna-gpu h-full w-full origin-bottom rounded-t-md",
                      kcal === 0 ? "bg-surface-muted" : fuera ? "bg-warning" : "bg-primary/70",
                    )}
                    style={{ transform: `scaleY(${kcal > 0 ? Math.max(0.12, kcal / maximo) : 0.06})` }}
                  />
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {kcal > 0 ? formatearNumero(Math.round(kcal)) : "—"}
                </span>
              </button>
            );
          })}
        </div>

        {/* ---------- Menu del dia elegido ---------- */}
        <div key={diaElegido} className="anim-vista">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-foreground text-sm font-semibold">
              {ETIQUETA_DIA[diaElegido]}
              {diaElegido === hoy && <span className="text-primary font-medium"> · Hoy</span>}
            </p>
            {porDia[diaElegido] > 0 && (
              <p className="text-muted-foreground text-xs tabular-nums">{formatearKcal(porDia[diaElegido])}</p>
            )}
          </div>
          {delDia.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">Este día no tiene platos en el plan.</p>
          ) : (
            <dl className="divide-border/60 mt-2 divide-y">
              {TIEMPOS_COMIDA.filter((t) => delDia.some((d) => d.tiempoComida === t)).map((tiempo) => (
                <div key={tiempo} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 py-2 text-sm">
                  <dt className="text-muted-foreground">{ETIQUETA_TIEMPO[tiempo]}</dt>
                  <dd className="text-foreground min-w-0 space-y-1">
                    {delDia
                      .filter((d) => d.tiempoComida === tiempo)
                      .map((d) => (
                        <div key={d.id} className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0">
                            {d.cantidad === 1 ? d.platoNombre : `${d.platoNombre} ×${formatearNumero(d.cantidad)}`}
                          </span>
                          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                            {formatearKcal(d.calorias)}
                          </span>
                        </div>
                      ))}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
