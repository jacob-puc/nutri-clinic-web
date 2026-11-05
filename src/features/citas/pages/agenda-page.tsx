import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { CalendarDays, CalendarPlus, CalendarX, ChevronLeft, ChevronRight, Clock, Link2 } from "lucide-react";
import { toast } from "sonner";

import { DetalleCitaSheet } from "@/features/citas/components/detalle-cita-sheet";
import { DialogoCita } from "@/features/citas/components/dialogo-cita";
import { JornadaDia } from "@/features/citas/components/jornada-dia";
import { ResumenEstados } from "@/features/citas/components/resumen-estados";
import { useCitas } from "@/features/citas/hooks/use-citas";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useHorarios, useNutricionistasQueAtienden } from "@/features/nutricionistas/hooks/use-nutricionistas";
import { INDICE_DIA } from "@/features/nutricionistas/lib/horario";
import { formatearHoraLocal } from "@/features/citas/lib/fechas-cita";
import { ETIQUETA_ESTADO_CITA } from "@/features/citas/lib/estados-cita";
import { dateOnlyDe, fechaDeDateOnly } from "@/lib/fechas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipSimple } from "@/components/ui/tooltip-simple";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mensajeDeError } from "@/lib/api-error";
import type { Cita, CitaFiltro, EstadoCita } from "@/types/api";
import { claveDia, hoyEnClinica, rangoDelDia } from "@/lib/zona-horaria";

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

const COLOR_ESTADO: Record<EstadoCita, { fondo: string; texto: string }> = {
  Programada: { fondo: "var(--info-soft)", texto: "var(--info-soft-foreground)" },
  Confirmada: { fondo: "var(--primary-soft)", texto: "var(--primary-soft-foreground)" },
  EnCurso: { fondo: "var(--warning-soft)", texto: "var(--warning-soft-foreground)" },
  Completada: { fondo: "var(--success-soft)", texto: "var(--success-soft-foreground)" },
  Cancelada: { fondo: "var(--destructive-soft)", texto: "var(--destructive-soft-foreground)" },
  NoAsistio: { fondo: "var(--muted)", texto: "var(--muted-foreground)" },
};

export function AgendaPage() {
  const [parametros, setParametros] = useSearchParams();
  const hoy = useMemo(() => new Date(), []);
  const claveHoy = hoyEnClinica();

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
  /* Quien atiende abre su propia agenda; recepcion y el filtro "Todo el
     equipo" ven la de todos. Con una sola persona el selector no aparece. */
  const { usuario } = useAuth();
  const { data: equipo = [] } = useNutricionistasQueAtienden();
  const [persona, setPersona] = useState<string>(() =>
    usuario && usuario.rol !== "Recepcion" ? usuario.id : TODOS,
  );
  const hayEquipo = equipo.length > 1;
  const nutricionistaId = hayEquipo && persona !== TODOS ? persona : undefined;

  /* Horas habiles del calendario: las de la persona filtrada o, con todo el
     equipo, las de la clinica. Lo de fuera se ve sombreado. */
  const horarios = useHorarios();
  const bloquesVisibles =
    (nutricionistaId ?? (equipo.length === 1 ? equipo[0]?.id : undefined))
      ? horarios.data?.personas.find((p) => p.nutricionistaId === (nutricionistaId ?? equipo[0]?.id))?.bloques
      : horarios.data?.clinica;
  const horasHabiles =
    bloquesVisibles && bloquesVisibles.length > 0
      ? bloquesVisibles.map((b) => ({ daysOfWeek: [INDICE_DIA[b.diaSemana]], startTime: b.horaInicio, endTime: b.horaFin }))
      : undefined;
  // La selección del calendario solo controla el resumen lateral de esa vista.
  // La pestaña Hoy siempre representa la fecha actual, sin depender del calendario.
  const [diaCalendario, setDiaCalendario] = useState(claveHoy);
  const [detalleDiaAbierto, setDetalleDiaAbierto] = useState(false);
  const [rango, setRango] = useState(() => rangoDelMes(hoy));
  const [vista, setVista] = useState<VistaCitas>(() =>
    parametros.get("vista") === "calendario" ? "calendario" : "hoy",
  );
  /* La vista interna del calendario (mes/semana/dia). FullCalendar solo lee
     `initialView` al construirse, asi que si se desmonta pierde la vista. Al
     recordarla aqui, que es un componente que NO se desmonta al alternar
     Hoy/Calendario, al volver a montar el calendario arranca donde estaba. */
  const [vistaDelCalendario, setVistaDelCalendario] = useState("dayGridMonth");
  const [tituloCalendario, setTituloCalendario] = useState("");
  const calendarioRef = useRef<FullCalendar>(null);
  const citaSeleccionadaId = parametros.get("cita");

  const filtroVisible = useMemo<CitaFiltro>(
    () => ({ ...rango, ...(nutricionistaId ? { nutricionistaId } : {}), ...(estado !== TODOS ? { estado } : {}) }),
    [rango, estado, nutricionistaId],
  );
  const citas = useCitas(filtroVisible);

  // Dia de hoy completo: el panel no depende del mes visible en el calendario.
  const filtroHoy = useMemo<CitaFiltro>(
    () => ({
      ...rangoDelDia(claveHoy),
      ...(nutricionistaId ? { nutricionistaId } : {}),
      ...(estado !== TODOS ? { estado } : {}),
    }),
    [claveHoy, estado, nutricionistaId],
  );
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

  const citasDelDiaCalendario = useMemo(
    () =>
      diaCalendario === claveHoy
        ? proximosHoy
        : visibles.filter((c) => claveDia(c.fechaInicio) === diaCalendario).sort(porOrden),
    [diaCalendario, claveHoy, proximosHoy, visibles],
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
          textColor: color.texto,
          classNames: [claseDeEstado(cita.estado)],
          extendedProps: {
            nutricionista: cita.nutricionistaNombre,
            motivo: cita.motivo ?? "",
            estado: cita.estado,
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
    /* La vista Hoy resume el mes en curso: al volver del calendario se
       descarta el rango que dejo la navegacion por meses. */
    if (siguiente === "hoy") setRango(rangoDelMes(hoy));
    const siguientes = new URLSearchParams(parametros);
    siguientes.set("vista", siguiente);
    setParametros(siguientes, { replace: true });
  };

  const cambiarVistaCalendario = (siguiente: string) => {
    calendarioRef.current?.getApi().changeView(siguiente);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <h1 className="font-editorial text-foreground text-3xl font-normal tracking-tight md:text-4xl">Citas</h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-surface-muted flex items-center gap-1 rounded-lg p-1 shadow-[inset_0_1px_2px_0_oklch(0.21_0.008_190/0.08)]" aria-label="Vista de citas">
            <button
              type="button"
              aria-pressed={vista === "hoy"}
              onClick={() => cambiarVista("hoy")}
              className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 active:translate-y-px ${
                vista === "hoy"
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:bg-card/55 hover:text-foreground"
              }`}
            >
              <Clock className="size-4" aria-hidden />
              Hoy
            </button>
            <button
              type="button"
              aria-pressed={vista === "calendario"}
              onClick={() => cambiarVista("calendario")}
              className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 active:translate-y-px ${
                vista === "calendario"
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:bg-card/55 hover:text-foreground"
              }`}
            >
              <CalendarDays className="size-4" aria-hidden />
              Calendario
            </button>
          </div>

          {hayEquipo && (
            <Select value={persona} onValueChange={setPersona}>
              <SelectTrigger className="w-[200px]" aria-label="Agenda de">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todo el equipo</SelectItem>
                {equipo.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.id === usuario?.id ? "Mis citas" : n.nombreCompleto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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

          <TooltipSimple contenido="Copia la página donde los pacientes reservan solos">
            <Button variant="outline" onClick={copiarEnlaceReserva}>
              <Link2 className="size-4" />
              Enlace de reservación
            </Button>
          </TooltipSimple>

          <Button onClick={() => setAltaAbierta(true)}>
            <CalendarPlus className="size-4" />
            Agendar cita
          </Button>
        </div>
      </div>

      <DialogoCita abierto={altaAbierta} onOpenChange={setAltaAbierta} />

      {vista === "hoy" ? (
        <div className="anim-vista mt-4">
          <JornadaDia
            esHoy
            clave={claveHoy}
            cargando={pendienteHoy}
            citas={proximosHoy}
            ahora={ahora}
            avance={{
              atendidas: citasHoy.filter((c) => c.estado === "Completada").length,
              total: citasHoy.filter((c) => c.estado !== "Cancelada").length,
            }}
            onAbrirCita={abrirCita}
            onAgendar={() => setAltaAbierta(true)}
            onVerCalendario={() => cambiarVista("calendario")}
          />
        </div>
      ) : (
        <div className="anim-vista mt-4 flex flex-col gap-4">
          <Card className="gap-0 overflow-hidden rounded-[1.5rem] py-0">
            <div className="flex flex-col gap-4 px-4 pt-6 pb-2 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="font-editorial text-foreground text-3xl font-normal tracking-tight first-letter:uppercase sm:text-4xl">
                  {tituloCalendario || hoy.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {visibles.length} {visibles.length === 1 ? "cita en este periodo" : "citas en este periodo"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-card p-1 shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Periodo anterior"
                    onClick={() => {
                      const api = calendarioRef.current?.getApi();
                      if (!api) return;
                      api.prev();
                      setDiaCalendario(dateOnlyDe(api.getDate()));
                    }}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => {
                      const api = calendarioRef.current?.getApi();
                      if (!api) return;
                      api.today();
                      setDiaCalendario(claveHoy);
                    }}
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Periodo siguiente"
                    onClick={() => {
                      const api = calendarioRef.current?.getApi();
                      if (!api) return;
                      api.next();
                      setDiaCalendario(dateOnlyDe(api.getDate()));
                    }}
                  >
                    <ChevronRight />
                  </Button>
                </div>

                <div className="flex items-center gap-0.5 rounded-xl border border-border/80 bg-card/75 p-1" aria-label="Vista del calendario">
                  {([
                    ["dayGridMonth", "Mes"],
                    ["timeGridWeek", "Semana"],
                    ["timeGridDay", "Día"],
                  ] as const).map(([valor, etiqueta]) => (
                    <button
                      key={valor}
                      type="button"
                      aria-pressed={vistaDelCalendario === valor}
                      onClick={() => cambiarVistaCalendario(valor)}
                      className={`h-8 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                        vistaDelCalendario === valor
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-primary-soft/45 px-4 pb-4 sm:px-6">
              <ResumenEstados resumen={resumen} />
            </div>

            <CardContent className="p-3 sm:p-5 md:px-7 md:pb-7">
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
                  ref={calendarioRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={vistaDelCalendario}
                  locale={esLocale}
                  firstDay={1}
                  height="auto"
                  slotMinTime="08:00:00"
                  businessHours={horasHabiles}
                  slotMaxTime="20:00:00"
                  headerToolbar={false}
                  events={eventos}
                  eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                  dayMaxEvents={3}
                  /* Las citas son siempre con hora: la fila de todo el dia sobra. */
                  allDaySlot={false}
                  /* Sin esto el mes las pinta como punto, sin el color del estado. */
                  eventDisplay="block"
                  nowIndicator
                  /* Dispara al montar y en cada cambio de vista, asi que
                     refleja en estado lo que el usuario eligio. Si el valor no
                     cambia, React corta el ciclo y no hay render extra. */
                  viewDidMount={(arg) => {
                    setVistaDelCalendario(arg.view.type);
                    setTituloCalendario(arg.view.title);
                  }}
                  datesSet={(arg) => {
                    const desde = arg.start.toISOString();
                    const hasta = arg.end.toISOString();
                    setTituloCalendario((actual) => actual === arg.view.title ? actual : arg.view.title);
                    setVistaDelCalendario((actual) => actual === arg.view.type ? actual : arg.view.type);
                    setRango((prev) =>
                      prev.desde === desde && prev.hasta === hasta ? prev : { desde, hasta },
                    );
                  }}
                  dateClick={(arg) => {
                    setDiaCalendario(dateOnlyDe(arg.date));
                    setDetalleDiaAbierto(true);
                  }}
                  dayCellClassNames={(arg) =>
                    dateOnlyDe(arg.date) === diaCalendario ? ["fc-day-selected-nutri"] : []
                  }
                  eventClick={(arg) => abrirCita(arg.event.id)}
                  eventContent={(arg) => {
                    const props = arg.event.extendedProps as {
                      nutricionista: string;
                      motivo: string;
                      estado: EstadoCita;
                    };
                    const inicio = arg.event.start;
                    const fin = arg.event.end;
                    const fecha = inicio?.toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });
                    const horaInicio = inicio ? formatearHoraLocal(inicio.toISOString()) : "";
                    const horaFin = fin ? formatearHoraLocal(fin.toISOString()) : "";
                    const etiquetaEstado = ETIQUETA_ESTADO_CITA[props.estado];

                    return (
                      <TooltipSimple
                        side="top"
                        className="max-w-[min(20rem,calc(100vw-2rem))] rounded-xl px-3.5 py-3 text-left shadow-xl"
                        contenido={
                          <div className="space-y-2">
                            <div>
                              <p className="font-semibold">{arg.event.title}</p>
                              <p className="text-background/75 mt-0.5">
                                {fecha} · {horaInicio}–{horaFin}
                              </p>
                            </div>
                            <p className="text-background/85">{props.nutricionista}</p>
                            <span className="inline-flex rounded-full bg-background/15 px-2 py-0.5 font-medium">
                              {etiquetaEstado}
                            </span>
                            {props.motivo && (
                              <p className="border-t border-background/15 pt-1.5 text-background/75">
                                {props.motivo}
                              </p>
                            )}
                          </div>
                        }
                      >
                        <div
                          className="cita-evento__contenido"
                          aria-label={`${arg.event.title}, ${fecha}, ${horaInicio} a ${horaFin}, ${props.nutricionista}, ${etiquetaEstado}`}
                        >
                          <span className="cita-evento__hora">{arg.timeText}</span>
                          <span className="cita-evento__nombre">{arg.event.title}</span>
                          {arg.view.type !== "dayGridMonth" && props.nutricionista && (
                            <span className="cita-evento__detalle">{props.nutricionista}</span>
                          )}
                        </div>
                      </TooltipSimple>
                    );
                  }}
                  eventDidMount={(arg) => {
                    const props = arg.event.extendedProps as {
                      nutricionista: string;
                      motivo: string;
                      estado: EstadoCita;
                    };
                    const fecha = arg.event.start?.toLocaleDateString("es-MX");
                    const hora = formatearHoraLocal(arg.event.start?.toISOString());
                    arg.el.removeAttribute("title");
                    arg.el.setAttribute(
                      "aria-label",
                      `${arg.event.title}, ${fecha}, ${hora}, ${props.nutricionista}, ${ETIQUETA_ESTADO_CITA[props.estado]}${props.motivo ? `, ${props.motivo}` : ""}`,
                    );
                  }}
                />
              )}
            </CardContent>
          </Card>

        </div>
      )}

      <Sheet open={detalleDiaAbierto} onOpenChange={setDetalleDiaAbierto}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-border bg-primary-soft/45 px-6 py-6 pr-14">
            <SheetTitle className="text-xl">Agenda del día</SheetTitle>
            <SheetDescription>
              {fechaDeDateOnly(diaCalendario)?.toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-5">
            <JornadaDia
              esHoy={diaCalendario === claveHoy}
              clave={diaCalendario}
              cargando={diaCalendario === claveHoy ? pendienteHoy : citas.isPending}
              citas={citasDelDiaCalendario}
              ahora={ahora}
              compacta
              enSheet
              onAbrirCita={abrirCita}
              onAgendar={() => setAltaAbierta(true)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <DetalleCitaSheet
        cita={citaSeleccionada}
        abierto={Boolean(citaSeleccionada)}
        onOpenChange={cerrarCita}
      />
    </div>
  );
}

/** Copia la liga publica para mandarla por WhatsApp o ponerla en redes. */
async function copiarEnlaceReserva() {
  const enlace = `${window.location.origin}/reservar`;
  try {
    await navigator.clipboard.writeText(enlace);
    toast.success("Enlace copiado", { description: enlace });
  } catch {
    toast.info("Enlace de reservación", { description: enlace });
  }
}
