import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  PlayCircle,
  Stethoscope,
  UserCheck,
} from "lucide-react";

import { BadgeEstadoCita } from "@/features/citas/components/badge-estado-cita";
import { formatearHoraLocal } from "@/features/citas/lib/fechas-cita";
import { useCitas } from "@/features/citas/hooks/use-citas";
import { HistorialConsultas } from "@/features/consultas/components/historial-consultas";
import { useConsultas, useConsultasAbiertas } from "@/features/consultas/hooks/use-consultas";
import { ETIQUETA_TIPO_CONSULTA } from "@/features/consultas/lib/etiquetas-consulta";
import { useCrearConsulta } from "@/features/consultas/hooks/use-mutaciones-consulta";
import { deducirTipoConsulta } from "@/features/consultas/lib/tipo-consulta";
import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import { Seccion } from "@/components/ficha/seccion";
import { EstadoError } from "@/components/states/estado-error";
import { EstadoVacio } from "@/components/states/estado-vacio";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { mensajeDeError } from "@/lib/api-error";
import { toast } from "sonner";
import type { Cita } from "@/types/api";
import { hoyCalendario, hoyEnClinica, rangoDelDia } from "@/lib/zona-horaria";


const FORMATO_DIA = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/**
 * La cola del día: las citas de hoy agrupadas por en qué punto de la atención
 * están. El orden de las secciones es el orden real del consultorio — quién
 * está adentro, a quién sigue, y a quién le falta confirmar.
 */
export function ConsultasPage() {
  const navigate = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const hoy = useMemo(() => hoyCalendario(), []);
  const rango = useMemo(() => rangoDelDia(hoyEnClinica()), []);

  /* Las vistas se controlan desde la URL (?vista=historial) para que el
     historial sea compartible y sobreviva al refresh. */
  const vista = parametros.get("vista") === "historial" ? "historial" : "cola";
  const cambiarVista = (siguiente: string) => {
    const siguientes = new URLSearchParams(parametros);
    if (siguiente === "cola") siguientes.delete("vista");
    else siguientes.set("vista", siguiente);
    setParametros(siguientes, { replace: true });
  };

  const citas = useCitas(rango);
  /* Un solo traqueo de consultas para saber el tipo de cada paciente: si va
     con la primera, se abre como Inicial; si ya tiene, como Seguimiento. */
  const consultas = useConsultas({});

  const iniciar = useCrearConsulta();
  const abiertas = useConsultasAbiertas();

  const porPaciente = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const consulta of consultas.data ?? []) {
      cuenta.set(consulta.pacienteId, (cuenta.get(consulta.pacienteId) ?? 0) + 1);
    }
    return cuenta;
  }, [consultas.data]);

  const lista = useMemo(() => citas.data ?? [], [citas.data]);
  const porAtender = useMemo(() => lista.filter((c) => c.estado === "Confirmada"), [lista]);
  const completadas = useMemo(
    () => lista.filter((c) => c.estado === "Completada").length,
    [lista],
  );

  const pendientes = porAtender.length;

  const alIniciar = (cita: Cita) => {
    iniciar.mutate(
      {
        pacienteId: cita.pacienteId,
        citaId: cita.id,
        tipoConsulta: deducirTipoConsulta(porPaciente.get(cita.pacienteId) ?? 0),
      },
      {
        onError: (error: unknown) =>
          toast.error("No se pudo iniciar la consulta", {
            description: mensajeDeError(error),
          }),
      },
    );
  };

  if (citas.isError) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <EncabezadoDia fecha={hoy} completadas={0} ocultarContador />
        <div className="mt-4">
          <EstadoError
            titulo="No pudimos cargar la agenda del día"
            mensaje={mensajeDeError(citas.error)}
            onReintentar={() => void citas.refetch()}
          >
            <Button variant="outline" onClick={() => navigate("/citas")}>
              Ir a citas
            </Button>
          </EstadoError>
        </div>
      </div>
    );
  }

  const cargando = citas.isPending;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <EncabezadoDia fecha={hoy} completadas={completadas} ocultarContador={cargando} />

      <Tabs value={vista} onValueChange={cambiarVista} className="mt-4">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="cola">
            Cola del día
            {pendientes > 0 && (
              <span className="bg-primary/12 text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                {pendientes}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="historial">
            Historial
            {completadas > 0 && (
              <span className="bg-primary/12 text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                {completadas}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cola" className="mt-4 space-y-4">
        {/* Lo primero de la cola es quien ya esta adentro: una consulta que se
            dejo a medias se retoma desde aqui, no se vuelve a iniciar. */}
        {(abiertas.data?.length ?? 0) > 0 && (
          <Seccion titulo="En curso" icono={Stethoscope} meta={`${abiertas.data!.length}`}>
            <ul className="divide-border/60 divide-y">
              {abiertas.data!.map((consulta) => (
                <li key={consulta.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="text-foreground w-12 shrink-0 text-sm font-semibold tabular-nums">
                    {formatearHoraLocal(consulta.fechaInicio)}
                  </span>
                  <AvatarPaciente nombre={consulta.pacienteNombre} id={consulta.pacienteId} className="size-9 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-foreground text-sm font-semibold">{consulta.pacienteNombre}</span>
                      <BadgeEstadoCita estado="EnCurso" />
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                      {ETIQUETA_TIPO_CONSULTA[consulta.tipoConsulta]} · con {consulta.nutricionistaNombre}
                    </p>
                  </div>
                  <Button size="sm" asChild className="ml-auto">
                    <Link to={`/consultas/${consulta.id}`}>
                      Continuar
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </Seccion>
        )}

        <Seccion
          titulo="Por atender"
          icono={UserCheck}
          meta={porAtender.length > 0 ? `${porAtender.length}` : undefined}
        >
          {cargando ? (
            <FilasSkeleton n={2} />
          ) : porAtender.length === 0 ? (
            <p className="text-muted-foreground py-2 text-sm">
              No quedan citas confirmadas por atender hoy.
            </p>
          ) : (
            <ul className="divide-border/60 divide-y">
              {porAtender.map((cita) => (
                <FilaCola key={cita.id} cita={cita}>
                  <Button
                    size="sm"
                    onClick={() => alIniciar(cita)}
                    disabled={iniciar.isPending}
                  >
                    {iniciar.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <PlayCircle className="size-4" />
                    )}
                    Iniciar atención
                  </Button>
                </FilaCola>
              ))}
            </ul>
          )}
        </Seccion>

        {!cargando && lista.length === 0 && (
          <EstadoVacio
            titulo="Día sin citas"
            descripcion="No hay citas agendadas para hoy. Puedes revisar el calendario o agendar una nueva."
          >
            <Button size="sm" onClick={() => navigate("/citas")}>
              Ir a citas
            </Button>
          </EstadoVacio>
        )}
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <HistorialConsultas />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EncabezadoDia({
  fecha,
  completadas,
  ocultarContador,
}: {
  fecha: Date;
  completadas: number;
  ocultarContador: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pb-2">
      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          Consultas
        </h1>
        <p className="text-muted-foreground mt-1 text-sm first-letter:uppercase">
          {FORMATO_DIA.format(fecha)}
        </p>
      </div>

      {!ocultarContador && completadas > 0 && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="text-success size-4" aria-hidden />
          <span className="tabular-nums">{completadas}</span>{" "}
          {completadas === 1 ? "consulta cerrada" : "consultas cerradas"} hoy
        </p>
      )}
    </div>
  );
}

function FilaCola({ cita, children }: { cita: Cita; children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-2.5">
      <span className="text-foreground w-12 shrink-0 text-sm font-semibold tabular-nums">
        {formatearHoraLocal(cita.fechaInicio)}
      </span>
      <AvatarPaciente nombre={cita.pacienteNombre} id={cita.pacienteId} className="size-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to={`/pacientes/${cita.pacienteId}`}
            className="text-foreground rounded-sm text-sm font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {cita.pacienteNombre}
          </Link>
          <BadgeEstadoCita estado={cita.estado} />
        </div>
        {cita.motivo && <p className="text-muted-foreground truncate text-xs">{cita.motivo}</p>}
      </div>
      <div className="ml-auto shrink-0">{children}</div>
    </li>
  );
}

function FilasSkeleton({ n }: { n: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando citas del día...</span>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-8 flex-1 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
