import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ClipboardCheck,
  Copy,
  Eye,
  FilePen,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Target,
  Trash2,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { EstadoError } from "@/components/states/estado-error";
import { EstadoVacio } from "@/components/states/estado-vacio";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { TarjetaEstadistica } from "@/components/ui/tarjeta-estadistica";
import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import { usePacientes } from "@/features/pacientes/hooks/use-pacientes";
import {
  BadgeEstadoPlan,
  BarraHerramientas,
  ConfirmarEliminacion,
  MedidorCalorias,
  TOLERANCIA_OBJETIVO,
  type FiltroVigencia,
} from "@/features/menus/components/comunes";
import { DialogoAsignarPlan } from "@/features/menus/components/dialogo-asignar-plan";
import { DialogoDuplicarPlan } from "@/features/menus/components/dialogo-duplicar-plan";
import { DialogoPlan } from "@/features/menus/components/dialogo-plan";
import {
  useEliminarMenuAsignado,
  useMenusAsignados,
  useRestaurarMenuAsignado,
} from "@/features/menus/hooks/use-menus";
import {
  avanceDelPlan,
  DIAS_SEMANA,
  ETIQUETA_DIA,
  ETIQUETA_DIA_CORTA,
  indiceDiaSemana,
  promedioDiario,
} from "@/features/menus/lib/menus";
import { menusApi } from "@/features/menus/api/menus-api";
import { mensajeDeError } from "@/lib/api-error";
import { formatearFechaCorta, normalizar } from "@/lib/formatters";
import { abrirPdfConAviso } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import { hoyEnClinica } from "@/lib/zona-horaria";
import type { DiaSemana, MenuAsignado } from "@/types/api";

function desvioDelPlan(plan: MenuAsignado): number | null {
  const calorias = promedioDiario(plan.detalles);
  return calorias !== null && plan.objetivoCalorico
    ? (calorias - plan.objetivoCalorico) / plan.objetivoCalorico
    : null;
}

export function TabPlanes() {
  const [busqueda, setBusqueda] = useState("");
  const [vigencia, setVigencia] = useState<FiltroVigencia>("vigentes");
  const [asignando, setAsignando] = useState(false);
  const [abierto, setAbierto] = useState<MenuAsignado | null>(null);
  const [duplicando, setDuplicando] = useState<MenuAsignado | null>(null);
  const [eliminando, setEliminando] = useState<MenuAsignado | null>(null);

  const consulta = useMenusAsignados({
    soloActivos: vigencia === "vigentes",
    ordenarPor: "fechainicio",
    descendente: true,
  });
  const pacientes = usePacientes();
  const eliminar = useEliminarMenuAsignado();
  const restaurar = useRestaurarMenuAsignado();

  const termino = normalizar(busqueda);
  const planes = useMemo(
    () =>
      (consulta.data ?? []).filter(
        (p) => normalizar(p.pacienteNombre).includes(termino) || normalizar(p.nombre).includes(termino),
      ),
    [consulta.data, termino],
  );

  /* Las cifras son de toda la clinica: no cambian con la busqueda. */
  const cifras = useMemo(() => {
    if (!consulta.data) return null;
    const vigentes = consulta.data.filter((p) => p.isActive);
    const activos = vigentes.filter((p) => p.estado === "Activo");
    const conPlan = new Set(activos.map((p) => p.pacienteId));
    return {
      activos: activos.length,
      borradores: vigentes.filter((p) => p.estado === "Borrador").length,
      fueraDeObjetivo: activos.filter((p) => Math.abs(desvioDelPlan(p) ?? 0) > TOLERANCIA_OBJETIVO).length,
      sinPlan: pacientes.data ? pacientes.data.filter((p) => !conPlan.has(p.id)).length : null,
    };
  }, [consulta.data, pacientes.data]);

  const grupos = useMemo(
    () => ({
      activos: planes.filter((p) => p.isActive && p.estado === "Activo"),
      borradores: planes.filter((p) => p.isActive && p.estado === "Borrador"),
      finalizados: planes.filter((p) => p.isActive && p.estado === "Finalizado"),
      eliminados: planes.filter((p) => !p.isActive),
    }),
    [planes],
  );

  const restaurarPlan = (plan: MenuAsignado) =>
    restaurar.mutate(plan.id, {
      onSuccess: () => toast.success("Plan restaurado", { description: plan.nombre }),
      onError: (error) => toast.error("No se pudo restaurar", { description: mensajeDeError(error) }),
    });

  const hayDatos = (consulta.data?.length ?? 0) > 0;
  const filtrando = vigencia !== "vigentes";
  const buscando = termino !== "";

  const tarjetas = (lista: MenuAsignado[]) => (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {lista.map((plan) => (
        <li key={plan.id} className="anim-entrada tarjeta-viva">
          <TarjetaPlan
            plan={plan}
            onAbrir={() => setAbierto(plan)}
            onDuplicar={() => setDuplicando(plan)}
            onEliminar={() => setEliminando(plan)}
            onRestaurar={() => restaurarPlan(plan)}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaEstadistica
          destacada
          icono={ClipboardCheck}
          etiqueta="Planes activos"
          valor={cifras ? cifras.activos : null}
          detalle="Pacientes siguiéndolos"
        />
        <TarjetaEstadistica
          icono={FilePen}
          tono="info"
          etiqueta="Borradores"
          valor={cifras ? cifras.borradores : null}
          detalle="Por revisar y activar"
        />
        <TarjetaEstadistica
          icono={Target}
          tono="aviso"
          etiqueta="Fuera de objetivo"
          valor={cifras ? cifras.fueraDeObjetivo : null}
          detalle="Más de 10% de desvío"
        />
        <TarjetaEstadistica
          icono={UserX}
          tono="peligro"
          etiqueta="Pacientes sin plan"
          valor={cifras ? cifras.sinPlan : null}
          detalle="Sin un plan activo"
        />
      </div>

      <BarraHerramientas
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        placeholder="Buscar por paciente o plan..."
        vigencia={vigencia}
        onVigencia={setVigencia}
        accion={
          <Button onClick={() => setAsignando(true)}>
            <Plus className="size-4" />
            Asignar plan
          </Button>
        }
      />

      {consulta.isPending && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      )}

      {consulta.isError && (
        <EstadoError
          titulo="No pudimos cargar los planes"
          mensaje={mensajeDeError(consulta.error)}
          onReintentar={consulta.refetch}
        />
      )}

      {consulta.isSuccess && !hayDatos && (
        <EstadoVacio
          icono={ClipboardCheck}
          titulo={filtrando ? "No hay planes con este filtro" : "Ningún paciente tiene plan todavía"}
          descripcion={
            filtrando
              ? "Prueba volviendo a los planes vigentes."
              : "Elige un paciente y una plantilla semanal; el plan se copia y lo ajustas a su medida."
          }
        >
          {!filtrando && (
            <Button onClick={() => setAsignando(true)} className="mt-1">
              <Plus className="size-4" />
              Asignar plan
            </Button>
          )}
        </EstadoVacio>
      )}

      {consulta.isSuccess && hayDatos && planes.length === 0 && (
        <EstadoVacio icono={Search} titulo="Sin coincidencias" descripcion={`Ningún plan coincide con "${busqueda}".`} />
      )}

      {grupos.activos.length > 0 && tarjetas(grupos.activos)}

      {grupos.borradores.length > 0 && (
        <GrupoPlanes titulo="Borradores" total={grupos.borradores.length} inicialAbierto forzarAbierto={buscando}>
          {tarjetas(grupos.borradores)}
        </GrupoPlanes>
      )}
      {grupos.finalizados.length > 0 && (
        <GrupoPlanes titulo="Finalizados" total={grupos.finalizados.length} forzarAbierto={buscando}>
          {tarjetas(grupos.finalizados)}
        </GrupoPlanes>
      )}
      {grupos.eliminados.length > 0 && (
        <GrupoPlanes titulo="Eliminados" total={grupos.eliminados.length} inicialAbierto forzarAbierto={buscando}>
          {tarjetas(grupos.eliminados)}
        </GrupoPlanes>
      )}

      <DialogoAsignarPlan abierto={asignando} onOpenChange={setAsignando} />
      <DialogoPlan abierto={abierto !== null} onOpenChange={(a) => !a && setAbierto(null)} plan={abierto} />
      <DialogoDuplicarPlan
        plan={duplicando}
        onOpenChange={(a) => !a && setDuplicando(null)}
        onDuplicado={(copia) => setAbierto(copia)}
      />

      <ConfirmarEliminacion
        abierto={eliminando !== null}
        onOpenChange={(a) => !a && setEliminando(null)}
        titulo={`¿Eliminar el plan de ${eliminando?.pacienteNombre ?? "este paciente"}?`}
        descripcion="Sale del listado de planes vigentes. Puedes restaurarlo después desde «Incluir eliminados»."
        onConfirmar={async () => {
          if (!eliminando) return;
          await eliminar.mutateAsync(eliminando.id);
          toast.success("Plan eliminado", { description: eliminando.nombre });
        }}
      />
    </div>
  );
}

function GrupoPlanes({
  titulo,
  total,
  inicialAbierto = false,
  forzarAbierto,
  children,
}: {
  titulo: string;
  total: number;
  inicialAbierto?: boolean;
  /** Al buscar se abre todo: un resultado no debe quedar escondido. */
  forzarAbierto: boolean;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(inicialAbierto);
  const visible = abierto || forzarAbierto;

  return (
    <section className="space-y-3">
      <button
        type="button"
        aria-expanded={visible}
        onClick={() => setAbierto(!visible)}
        className="text-foreground focus-visible:ring-ring flex cursor-pointer items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-2"
      >
        <ChevronDown className={cn("text-muted-foreground size-4 transition-transform", !visible && "-rotate-90")} aria-hidden />
        {titulo}
        <span className="text-muted-foreground font-normal tabular-nums">{total}</span>
      </button>
      {visible && children}
    </section>
  );
}

function TarjetaPlan({
  plan,
  onAbrir,
  onDuplicar,
  onEliminar,
  onRestaurar,
}: {
  plan: MenuAsignado;
  onAbrir: () => void;
  onDuplicar: () => void;
  onEliminar: () => void;
  onRestaurar: () => void;
}) {
  const hoy = hoyEnClinica();
  const editable = plan.isActive && plan.estado !== "Finalizado";
  const enCurso = plan.isActive && plan.estado === "Activo";
  const avance = enCurso ? avanceDelPlan(plan.fechaInicio, hoy) : null;

  return (
    <article
      className={cn(
        "hoja flex h-full flex-col rounded-xl",
        !plan.isActive && "opacity-60",
      )}
    >
      <header className="flex items-start gap-3 px-5 pt-5">
        <AvatarPaciente nombre={plan.pacienteNombre} id={plan.pacienteId} />
        <div className="min-w-0 flex-1">
          <Link
            to={`/pacientes/${plan.pacienteId}`}
            className="text-foreground focus-visible:ring-ring block truncate rounded-sm font-semibold outline-none hover:underline focus-visible:ring-2"
          >
            {plan.pacienteNombre}
          </Link>
          <button
            type="button"
            onClick={onAbrir}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring block max-w-full cursor-pointer truncate rounded-sm text-left text-xs outline-none focus-visible:ring-2"
          >
            {plan.nombre}
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground -mt-1 -mr-2 shrink-0"
              aria-label={`Más acciones del plan de ${plan.pacienteNombre}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {plan.isActive ? (
              <DropdownMenuItem variant="destructive" disabled={plan.estado === "Activo"} onSelect={onEliminar}>
                <Trash2 />
                {plan.estado === "Activo" ? "Finalízalo para eliminar" : "Eliminar"}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={onRestaurar}>
                <RotateCcw />
                Restaurar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="space-y-4 px-5 pt-4 pb-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs tabular-nums">
              {avance
                ? `Semana ${avance.semana} · día ${avance.dia} de 7`
                : `${plan.fechaInicio.slice(0, 10) > hoy ? "Empieza el" : "Inició el"} ${formatearFechaCorta(plan.fechaInicio)}`}
            </p>
            <BadgeEstadoPlan estado={plan.estado} />
          </div>
          {avance && (
            <div className="bg-surface-muted mt-1.5 h-1.5 overflow-hidden rounded-full" aria-hidden>
              <div className="barra-gpu bg-primary h-full w-full origin-left rounded-full" style={{ transform: `scaleX(${avance.dia / 7})` }} />
            </div>
          )}
        </div>

        <SemanaPlan plan={plan} hoy={enCurso ? DIAS_SEMANA[indiceDiaSemana(hoy)] : undefined} />

        <MedidorCalorias calorias={promedioDiario(plan.detalles)} objetivo={plan.objetivoCalorico} />
      </div>

      <footer className="border-border-strong mt-auto flex items-center gap-2 border-t border-dashed px-5 py-3">
        <Button variant="outline" size="sm" onClick={onAbrir}>
          {editable ? <Pencil className="size-4" /> : <Eye className="size-4" />}
          {editable ? "Editar" : "Ver"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          aria-label={`Imprimir el plan de ${plan.pacienteNombre}`}
          onClick={() => abrirPdfConAviso(() => menusApi.abrirMenuPdf(plan.id))}
        >
          <Printer className="size-4" />
          PDF
        </Button>
        {plan.isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            aria-label={`Duplicar el plan de ${plan.pacienteNombre}`}
            onClick={onDuplicar}
          >
            <Copy className="size-4" />
            Duplicar
          </Button>
        )}
      </footer>
    </article>
  );
}

/** Lunes a domingo: la casilla se llena segun los platos del dia y hoy va marcado. */
function SemanaPlan({ plan, hoy }: { plan: MenuAsignado; hoy: DiaSemana | undefined }) {
  const platosPorDia = new Map<DiaSemana, number>();
  for (const d of plan.detalles) platosPorDia.set(d.diaSemana, (platosPorDia.get(d.diaSemana) ?? 0) + 1);

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {DIAS_SEMANA.map((dia) => {
        const n = platosPorDia.get(dia) ?? 0;
        const esHoy = dia === hoy;
        return (
          <div key={dia} className="text-center">
            <span className={cn("text-[10px] font-semibold", esHoy ? "text-primary" : "text-muted-foreground")}>
              {ETIQUETA_DIA_CORTA[dia].charAt(0)}
            </span>
            <span
              role="img"
              aria-label={`${ETIQUETA_DIA[dia]}${esHoy ? " (hoy)" : ""}: ${n === 0 ? "sin platos" : `${n} plato${n === 1 ? "" : "s"}`}`}
              className={cn(
                "mt-0.5 block h-6 rounded-[5px]",
                n === 0 ? "bg-muted" : n <= 2 ? "bg-primary/35" : n <= 4 ? "bg-primary/60" : "bg-primary/85",
                esHoy && "ring-primary ring-offset-card ring-2 ring-offset-1",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
