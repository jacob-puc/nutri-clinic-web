import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { CalendarDays, CalendarPlus, CalendarX, Clock, TrendingUp } from "lucide-react";

import { BotonesEstadoCita } from "@/features/citas/components/acciones-cita";
import { BadgeEstadoCita } from "@/features/citas/components/badge-estado-cita";
import { DetalleCitaSheet } from "@/features/citas/components/detalle-cita-sheet";
import { DialogoCita } from "@/features/citas/components/dialogo-cita";
import { useCitas } from "@/features/citas/hooks/use-citas";
import {
  formatearFechaLargaClave,
  formatearHoraLocal,
} from "@/features/citas/lib/fechas-cita";
import { ETIQUETA_ESTADO_CITA } from "@/features/citas/lib/estados-cita";
import { dateOnlyDe } from "@/lib/fechas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mensajeDeError } from "@/lib/api-error";
import type { Cita, CitaFiltro, EstadoCita } from "@/types/api";

const TODOS = "todos" as const;
type FiltroEstado = EstadoCita | typeof TODOS;
type VistaCitas = "hoy" | "calendario";

const ESTADOS: EstadoCita[] = [
  "Programada",
  "Confirmada",
  "EnCurso",
  "Completada",
  "Cancelada",
  "NoAsistio",
];

/** Rango de un mes completo en hora local, como instantes para la API. */
function rangoDelMes(base: Date): { desde: string; hasta: string } {
  const desde = new Date(base.getFullYear(), base.getMonth(), 1);
  const hasta = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

function claseDeEstado(estado: EstadoCita): string {
  return `cita-${estado.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
}

const COLOR_ESTADO: Record<EstadoCita, { fondo: string; borde: string; texto: string }> = {
  Programada: { fondo: "var(--info-soft)", borde: "var(--info)", texto: "var(--info-soft-foreground)" },
  Confirmada: { fondo: "var(--primary-soft)", borde: "var(--primary)", texto: "var(--primary-soft-foreground)" },
  EnCurso: { fondo: "var(--warning-soft)", borde: "var(--warning)", texto: "var(--warning-soft-foreground)" },
  Completada: { fondo: "var(--success-soft)", borde: "var(--success)", texto: "var(--success-soft-foreground)" },
  Cancelada: { fondo: "var(--destructive-soft)", borde: "var(--destructive)", texto: "var(--destructive-soft-foreground)" },
  NoAsistio: { fondo: "var(--muted)", borde: "var(--muted-foreground)", texto: "var(--muted-foreground)" },
};

export function AgendaPage() {
  const [parametros, setParametros] = useSearchParams();
  const hoy = useMemo(() => new Date(), []);
  const claveHoy = dateOnlyDe(hoy);

  // La hora actual vive en estado y se refresca cada minuto: sin ella en
  // render, el panel de proximos se actualiza solo a medida que pasa el dia.
  const [ahora, setAhora] = useState(0);
  useEffect(() => {
    setAhora(Date.now());
    const id = setInterval(() => setAhora(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const [altaAbierta, setAltaAbierta] = useState(false);
  const [estado, setEstado] = useState<FiltroEstado>(TODOS);
  const [diaSeleccionado, setDiaSeleccionado] = useState(claveHoy);
  const [rango, setRango] = useState(() => rangoDelMes(hoy));
  const [vista, setVista] = useState<VistaCitas>(() =>
    parametros.get("vista") === "calendario" ? "calendario" : "hoy",
  );
  const citaSeleccionadaId = parametros.get("cita");

  const filtroVisible = useMemo<CitaFiltro>(
    () => ({ ...rango, ...(estado !== TODOS ? { estado } : {}) }),
    [rango, estado],
  );
  const citas = useCitas(filtroVisible);

  // Dia de hoy completo: el panel no depende del mes visible en el calendario.
  const filtroHoy = useMemo<CitaFiltro>(() => {
    const desde = new Date(hoy);
    desde.setHours(0, 0, 0, 0);
    const hasta = new Date(hoy);
    hasta.setHours(23, 59, 59, 999);
    return {
      desde: desde.toISOString(),
      hasta: hasta.toISOString(),
      ...(estado !== TODOS ? { estado } : {}),
    };
  }, [hoy, estado]);
  const { data: citasHoy = [], isPending: pendienteHoy } = useCitas(filtroHoy);

  const visibles = useMemo(() => citas.data ?? [], [citas.data]);
  const citaSeleccionada = useMemo(
    () => visibles.find((cita) => cita.id === citaSeleccionadaId),
    [citaSeleccionadaId, visibles],
  );
  const porOrden = (a: Cita, b: Cita) => a.fechaInicio.localeCompare(b.fechaInicio);

  const proximosHoy = useMemo(
    () =>
      citasHoy
        .filter((c) => new Date(c.fechaFin).getTime() >= ahora)
        .sort(porOrden),
    [citasHoy, ahora],
  );

  const citasDelDia = useMemo(
    () =>
      diaSeleccionado === claveHoy
        ? proximosHoy
        : visibles.filter((c) => dateOnlyDe(new Date(c.fechaInicio)) === diaSeleccionado).sort(porOrden),
    [diaSeleccionado, claveHoy, proximosHoy, visibles],
  );

  const eventos = useMemo(
    () =>
      visibles.map((cita) => {
        const color = COLOR_ESTADO[cita.estado];
        return {
          id: cita.id,
          title: cita.pacienteNombre,
          start: cita.fechaInicio,
          end: cita.fechaFin,
          backgroundColor: color.fondo,
          borderColor: color.borde,
          textColor: color.texto,
          classNames: [claseDeEstado(cita.estado)],
          extendedProps: {
            nutricionista: cita.nutricionistaNombre,
            motivo: cita.motivo ?? "",
          },
        };
      }),
    [visibles],
  );

  const resumen = useMemo(() => {
    const cuenta = new Map<EstadoCita, number>();
    for (const cita of visibles) cuenta.set(cita.estado, (cuenta.get(cita.estado) ?? 0) + 1);
    return ESTADOS.filter((valor) => (cuenta.get(valor) ?? 0) > 0).map((valor) => ({
      valor,
      cantidad: cuenta.get(valor) ?? 0,
    }));
  }, [visibles]);

  const abrirCita = (citaId: string) => {
    const siguientes = new URLSearchParams(parametros);
    siguientes.set("cita", citaId);
    setParametros(siguientes);
  };

  const cerrarCita = (abierto: boolean) => {
    if (abierto) return;
    const siguientes = new URLSearchParams(parametros);
    siguientes.delete("cita");
    setParametros(siguientes, { replace: true });
  };

  const cambiarVista = (siguiente: VistaCitas) => {
    setVista(siguiente);
    const siguientes = new URLSearchParams(parametros);
    siguientes.set("vista", siguiente);
    setParametros(siguientes, { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">Citas</h1>
          <Badge variant="outline" className="border-border text-muted-foreground tabular-nums">
            {visibles.length} {visibles.length === 1 ? "cita" : "citas"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-muted flex items-center gap-1 rounded-lg p-1" aria-label="Vista de citas">
            <button
              type="button"
              aria-pressed={vista === "hoy"}
              onClick={() => cambiarVista("hoy")}
              className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors ${
                vista === "hoy"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="size-4" aria-hidden />
              Hoy
            </button>
            <button
              type="button"
              aria-pressed={vista === "calendario"}
              onClick={() => cambiarVista("calendario")}
              className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors ${
                vista === "calendario"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="size-4" aria-hidden />
              Calendario
            </button>
          </div>

          <Select
            value={estado}
            onValueChange={(valor) => setEstado(valor as FiltroEstado)}
          >
            <SelectTrigger className="w-[176px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los estados</SelectItem>
              {ESTADOS.map((valor) => (
                <SelectItem key={valor} value={valor}>
                  {ETIQUETA_ESTADO_CITA[valor]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setAltaAbierta(true)}>
            <CalendarPlus className="size-4" />
            Agendar cita
          </Button>
        </div>
      </div>

      <DialogoCita abierto={altaAbierta} onOpenChange={setAltaAbierta} />

      {vista === "hoy" ? (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <PanelDia
            esHoy={diaSeleccionado === claveHoy}
            clave={diaSeleccionado}
            cargando={pendienteHoy || citas.isPending}
            citas={citasDelDia}
            onVerHoy={() => setDiaSeleccionado(claveHoy)}
            onAbrirCita={abrirCita}
          />
          <ResumenCitas resumen={resumen} titulo="Resumen de citas" />
        </div>
      ) : (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <Card className="overflow-hidden py-0">
            <CardContent className="p-3 md:p-4">
              {citas.isError ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center">
                  <CalendarX className="text-muted-foreground size-7" aria-hidden />
                  <div>
                    <p className="font-semibold">No pudimos cargar las citas</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {mensajeDeError(citas.error)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void citas.refetch()}>
                    Reintentar
                  </Button>
                </div>
              ) : citas.isPending ? (
                <div className="space-y-3" aria-busy="true" aria-live="polite">
                  <span className="sr-only">Cargando calendario...</span>
                  <Skeleton className="h-8 w-56" />
                  <div className="grid gap-2 sm:grid-cols-7">
                    {Array.from({ length: 35 }, (_, i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                </div>
              ) : (
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale={esLocale}
                  firstDay={1}
                  height="auto"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                  }}
                  events={eventos}
                  eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                  dayMaxEvents={3}
                  nowIndicator
                  datesSet={(arg) => {
                    const desde = arg.start.toISOString();
                    const hasta = arg.end.toISOString();
                    setRango((prev) =>
                      prev.desde === desde && prev.hasta === hasta ? prev : { desde, hasta },
                    );
                  }}
                  dateClick={(arg) => setDiaSeleccionado(dateOnlyDe(arg.date))}
                  eventClick={(arg) => abrirCita(arg.event.id)}
                  eventDidMount={(arg) => {
                    const props = arg.event.extendedProps;
                    arg.el.title = `${formatearHoraLocal(String(arg.event.start))} — ${props.nutricionista}${props.motivo ? ` · ${props.motivo}` : ""}`;
                  }}
                />
              )}
            </CardContent>
          </Card>

          <aside className="flex w-full flex-col gap-4 lg:w-auto">
            <PanelDia
              esHoy={diaSeleccionado === claveHoy}
              clave={diaSeleccionado}
              cargando={pendienteHoy || citas.isPending}
              citas={citasDelDia}
              onVerHoy={() => setDiaSeleccionado(claveHoy)}
              onAbrirCita={abrirCita}
            />
            <ResumenCitas resumen={resumen} titulo="Resumen de la vista" />
          </aside>
        </div>
      )}

      <DetalleCitaSheet
        cita={citaSeleccionada}
        abierto={Boolean(citaSeleccionada)}
        onOpenChange={cerrarCita}
      />
    </div>
  );
}

function ResumenCitas({
  resumen,
  titulo,
}: {
  resumen: Array<{ valor: EstadoCita; cantidad: number }>;
  titulo: string;
}) {
  return (
    <Card className="py-0">
      <CardContent className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-primary size-4" aria-hidden />
          <h2 className="text-sm font-semibold">{titulo}</h2>
        </div>
        <Separator className="my-2" />
        {resumen.length === 0 ? (
          <p className="text-muted-foreground py-3 text-sm">Sin citas en este rango.</p>
        ) : (
          <ul className="space-y-1.5">
            {resumen.map(({ valor, cantidad }) => (
              <li key={valor} className="flex items-center justify-between gap-2 text-sm">
                <BadgeEstadoCita estado={valor} />
                <span className="text-muted-foreground tabular-nums">{cantidad}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Tabla de los proximos del dia, o de toda la jornada si se eligio otro dia. */
function PanelDia({
  esHoy,
  clave,
  cargando,
  citas,
  onVerHoy,
  onAbrirCita,
}: {
  esHoy: boolean;
  clave: string;
  cargando: boolean;
  citas: Cita[];
  onVerHoy: () => void;
  onAbrirCita: (citaId: string) => void;
}) {
  return (
    <Card className="py-0">
      <CardContent className="px-4 pt-3 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="text-primary size-4" aria-hidden />
            {esHoy ? "Próximos de hoy" : "Citas del día"}
          </h2>
          {!esHoy && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onVerHoy}>
              Ver hoy
            </Button>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {formatearFechaLargaClave(clave)}
        </p>
        <Separator className="my-2" />

        {cargando ? (
          <div className="space-y-2" aria-busy="true" aria-live="polite">
            <span className="sr-only">Cargando citas del día...</span>
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        ) : citas.length === 0 ? (
          <p className="text-muted-foreground py-5 text-center text-sm">
            {esHoy
              ? "No quedan citas pendientes para hoy."
              : "Sin citas en este día."}
          </p>
        ) : (
          <ul className="space-y-3">
            {citas.map((cita) => (
              <li key={cita.id} className="space-y-1.5 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <button
                    type="button"
                    onClick={() => onAbrirCita(cita.id)}
                    className="rounded-sm text-sm font-semibold tabular-nums outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {formatearHoraLocal(cita.fechaInicio)}
                  </button>
                  <Link
                    to={`/pacientes/${cita.pacienteId}`}
                    className="min-w-0 truncate rounded-sm text-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {cita.pacienteNombre}
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <BadgeEstadoCita estado={cita.estado} />
                  <BotonesEstadoCita cita={cita} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
