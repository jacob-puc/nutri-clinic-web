import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarOff,
  CalendarPlus,
  ClipboardList,
  HeartHandshake,
  Stethoscope,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { Seccion } from "@/components/ficha/seccion";
import { TarjetaEstadistica } from "@/components/ui/tarjeta-estadistica";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { usePermisos } from "@/features/auth/hooks/use-permisos";
import { DialogoCita } from "@/features/citas/components/dialogo-cita";
import { JornadaDia } from "@/features/citas/components/jornada-dia";
import { useCitas } from "@/features/citas/hooks/use-citas";
import { usePagos, usePorCobrar } from "@/features/cobros/hooks/use-cobros";
import { formatearMoneda } from "@/features/cobros/lib/cobros";
import { useConsultas, useConsultasAbiertas } from "@/features/consultas/hooks/use-consultas";
import { AvatarPersona } from "@/features/nutricionistas/components/comunes";
import {
  useAusencias,
  useHorarios,
  useNutricionistasQueAtienden,
} from "@/features/nutricionistas/hooks/use-nutricionistas";
import {
  bloquesDelDia,
  diaDeClave,
  diaNoDisponible,
  reglasDe,
  textoBloques,
} from "@/features/nutricionistas/lib/horario";
import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import { DialogoPaciente } from "@/features/pacientes/components/dialogo-paciente";
import { formatearTiempoRelativo } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { formatearInstante, hoyEnClinica, partesEnClinica, rangoDelDia, sumarDias } from "@/lib/zona-horaria";
import type { Cita, Guid } from "@/types/api";

/** Dias sin consulta a partir de los cuales un paciente se sugiere para seguimiento. */
const DIAS_SIN_VOLVER = 30;
/** Hasta cuando hacia atras se buscan consultas para el seguimiento. */
const VENTANA_SEGUIMIENTO = 180;

/**
 * Primera pantalla del dia: como va la jornada, que pide atencion (consultas
 * abiertas, cobros, pacientes por recuperar) y quien atiende hoy. Todo sale
 * de las mismas consultas que usan los modulos, asi que React Query las
 * comparte al navegar.
 */
export function ResumenPage() {
  const { usuario } = useAuth();
  const permisos = usePermisos();
  const navigate = useNavigate();
  const { data: equipo = [] } = useNutricionistasQueAtienden();
  const [agendando, setAgendando] = useState(false);
  const [creandoPaciente, setCreandoPaciente] = useState(false);

  /* La hora vive en estado y avanza cada minuto: la jornada y el saludo se
     actualizan solos si la pantalla se queda abierta. */
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const claveHoy = hoyEnClinica();
  const rangoHoy = useMemo(() => rangoDelDia(claveHoy), [claveHoy]);

  /* Quien atiende ve su propio dia (como en la agenda); recepcion y el
     administrador, el de toda la clinica. */
  const soloMias = permisos.rol === "Nutricionista" && equipo.length > 1 && Boolean(usuario);
  const filtroCitas = useMemo(
    () => ({ ...rangoHoy, ...(soloMias && usuario ? { nutricionistaId: usuario.id } : {}) }),
    [rangoHoy, soloMias, usuario],
  );
  const citasHoy = useCitas(filtroCitas);

  const citas = useMemo(
    () =>
      (citasHoy.data ?? [])
        .filter((c) => c.estado !== "Cancelada")
        .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio)),
    [citasHoy.data],
  );
  const proximas = citas.filter((c) => new Date(c.fechaFin).getTime() >= ahora && c.estado !== "Completada" && c.estado !== "NoAsistio");
  const atendidas = citas.filter((c) => c.estado === "Completada").length;
  const porConfirmar = citas.filter((c) => c.estado === "Programada").length;

  const reloj = partesEnClinica(ahora);
  const saludo = reloj.hora < 12 ? "Buenos días" : reloj.hora < 19 ? "Buenas tardes" : "Buenas noches";
  const nombre = usuario?.nombreCompleto.split(" ")[0] ?? "";
  const fechaLarga = formatearInstante(ahora, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm first-letter:uppercase">{fechaLarga}</p>
          <h1 className="text-foreground mt-0.5 text-2xl font-semibold tracking-tight md:text-3xl">
            {saludo}
            {nombre && `, ${nombre}`}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {soloMias ? "Así va tu día." : "Así va la clínica hoy."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCreandoPaciente(true)}>
            <UserPlus className="size-4" />
            Nuevo paciente
          </Button>
          <Button onClick={() => setAgendando(true)}>
            <CalendarPlus className="size-4" />
            Agendar cita
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TarjetaEstadistica
          icono={CalendarCheck2}
          etiqueta={soloMias ? "Mis citas hoy" : "Citas hoy"}
          destacada
          valor={citasHoy.isSuccess ? citas.length : null}
          detalle={`${atendidas} atendidas · ${proximas.length} por atender`}
          href="/citas"
        />
        {permisos.verClinico ? (
          <IndicadorEnConsulta />
        ) : (
          <TarjetaEstadistica
            icono={CalendarClock}
            etiqueta="Por confirmar hoy"
            valor={citasHoy.isSuccess ? porConfirmar : null}
            detalle="Citas que aún no confirman"
            href="/citas"
            tono="aviso"
          />
        )}
        <IndicadorCobrado rango={rangoHoy} />
        <IndicadorPorCobrar />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <JornadaDia
            esHoy
            clave={claveHoy}
            cargando={citasHoy.isPending}
            citas={proximas}
            ahora={ahora}
            onAbrirCita={(id) => navigate(`/citas?cita=${id}`)}
            onAgendar={() => setAgendando(true)}
            onVerCalendario={() => navigate("/citas?vista=calendario")}
          />
        </div>

        <div className="space-y-6">
          {permisos.verClinico && <ConsultasEnCurso />}
          <PorCobrar />
          {!soloMias && equipo.length > 0 && <EquipoHoy claveHoy={claveHoy} citas={citasHoy.data ?? []} />}
          {permisos.verClinico && <Seguimiento />}
        </div>
      </div>

      <DialogoCita abierto={agendando} onOpenChange={setAgendando} />
      <DialogoPaciente abierto={creandoPaciente} onOpenChange={setCreandoPaciente} />
    </div>
  );
}

/* ---------------- Indicadores ---------------- */

function IndicadorEnConsulta() {
  const abiertas = useConsultasAbiertas();
  const total = abiertas.data?.length ?? 0;
  return (
    <TarjetaEstadistica
      icono={Stethoscope}
      etiqueta="En consulta ahora"
      valor={abiertas.isSuccess ? total : null}
      detalle={total === 0 ? "Nadie en consulta" : total === 1 ? "1 consulta abierta" : `${total} consultas abiertas`}
      href="/consultas"
      tono="info"
    />
  );
}

function IndicadorCobrado({ rango }: { rango: { desde: string; hasta: string } }) {
  const pagos = usePagos({ estado: "Pagado", fechaInicio: rango.desde, fechaFin: rango.hasta });
  const lista = pagos.data ?? [];
  const total = lista.reduce((s, p) => s + p.monto, 0);
  return (
    <TarjetaEstadistica
      icono={Wallet}
      etiqueta="Cobrado hoy"
      valor={pagos.isSuccess ? formatearMoneda(total) : null}
      detalle={`${lista.length} ${lista.length === 1 ? "cobro" : "cobros"}`}
      href="/cobros?vista=cobros"
      tono="exito"
    />
  );
}

function IndicadorPorCobrar() {
  const { pendientes, cargando } = usePorCobrar();
  return (
    <TarjetaEstadistica
      icono={ClipboardList}
      etiqueta="Por cobrar"
      valor={cargando ? null : pendientes.length}
      detalle={pendientes.length === 0 ? "Todo cobrado" : "Consultas cerradas sin cobro"}
      href="/cobros"
      tono={pendientes.length > 0 ? "aviso" : "exito"}
    />
  );
}

/* ---------------- Paneles ---------------- */

function ConsultasEnCurso() {
  const abiertas = useConsultasAbiertas();
  const lista = abiertas.data ?? [];
  if (!abiertas.isSuccess || lista.length === 0) return null;

  return (
    <Seccion titulo="En consulta" icono={Stethoscope} meta={`${lista.length} ${lista.length === 1 ? "abierta" : "abiertas"}`}>
      <ul className="space-y-2">
        {lista.map((c) => (
          <li key={c.id}>
            <Link
              to={`/consultas/${c.id}`}
              className="border-primary/25 bg-primary-soft/40 hover:bg-primary-soft/70 flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors"
            >
              <span className="relative">
                <AvatarPaciente nombre={c.pacienteNombre} id={c.pacienteId} className="size-8 text-[11px]" />
                <span className="bg-success ring-card absolute -right-0.5 -bottom-0.5 size-2.5 animate-pulse rounded-full ring-2" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-foreground block truncate text-sm font-medium">{c.pacienteNombre}</span>
                <span className="text-muted-foreground text-xs">
                  Desde las {formatearInstante(c.fechaInicio, { hour: "2-digit", minute: "2-digit" })} · {c.nutricionistaNombre.split(" ")[0]}
                </span>
              </span>
              <span className="text-primary flex items-center gap-1 text-xs font-semibold">
                Continuar
                <ArrowRight className="size-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

function PorCobrar() {
  const { pendientes, cargando } = usePorCobrar();
  return (
    <Seccion
      titulo="Por cobrar"
      icono={Wallet}
      meta={pendientes.length > 0 ? `${pendientes.length} ${pendientes.length === 1 ? "pendiente" : "pendientes"}` : undefined}
      acciones={
        pendientes.length > 0 ? (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/cobros">
              Cobrar
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : undefined
      }
    >
      {cargando ? (
        <Skeleton className="h-16 w-full" />
      ) : pendientes.length === 0 ? (
        <p className="text-muted-foreground text-sm">Todas las consultas cerradas están cobradas.</p>
      ) : (
        <ul className="divide-border/70 -my-1 divide-y">
          {pendientes.slice(0, 4).map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2">
              <AvatarPaciente nombre={c.pacienteNombre} id={c.pacienteId} className="size-7 text-[10px]" />
              <span className="text-foreground min-w-0 flex-1 truncate text-sm">{c.pacienteNombre}</span>
              <span className="text-muted-foreground shrink-0 text-xs">{formatearTiempoRelativo(c.fechaFin)}</span>
            </li>
          ))}
          {pendientes.length > 4 && (
            <li className="text-muted-foreground pt-2 text-xs">y {pendientes.length - 4} más</li>
          )}
        </ul>
      )}
    </Seccion>
  );
}

/** Quien atiende hoy, en que horario, cuantas citas lleva y quien falta. */
function EquipoHoy({ claveHoy, citas }: { claveHoy: string; citas: Cita[] }) {
  const { data: equipo = [] } = useNutricionistasQueAtienden();
  const horarios = useHorarios();
  const ausencias = useAusencias();

  const porPersona = new Map<Guid, number>();
  for (const c of citas) {
    if (c.estado === "Cancelada") continue;
    porPersona.set(c.nutricionistaId, (porPersona.get(c.nutricionistaId) ?? 0) + 1);
  }

  return (
    <Seccion titulo="Equipo hoy" icono={Users}>
      <ul className="space-y-2.5">
        {equipo.map((persona) => {
          const reglas = reglasDe(persona.id, horarios.data, ausencias.data);
          const fuera = horarios.data ? diaNoDisponible(reglas, claveHoy) : null;
          const horario = reglas.restringe ? textoBloques(bloquesDelDia(reglas.bloques, diaDeClave(claveHoy))) : "";
          const total = porPersona.get(persona.id) ?? 0;
          return (
            <li key={persona.id} className={cn("flex items-center gap-3", fuera && "opacity-70")}>
              <AvatarPersona nombre={persona.nombreCompleto} id={persona.id} className="size-8 text-[11px]" />
              <span className="min-w-0 flex-1">
                <span className="text-foreground block truncate text-sm font-medium">{persona.nombreCompleto}</span>
                <span className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                  {fuera ? (
                    <>
                      <CalendarOff className="size-3 shrink-0" aria-hidden />
                      {fuera}
                    </>
                  ) : horario ? (
                    `Atiende ${horario}`
                  ) : (
                    "Sin horario configurado"
                  )}
                </span>
              </span>
              {!fuera && (
                <span className="bg-surface-subtle text-foreground shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums">
                  {total} {total === 1 ? "cita" : "citas"}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Seccion>
  );
}

/**
 * Pacientes que no han vuelto: su ultima consulta fue hace mas de un mes y no
 * tienen cita futura. En nutricion la adherencia depende del seguimiento,
 * asi que se proponen para llamarles y agendar.
 */
function Seguimiento() {
  const claveHoy = hoyEnClinica();
  const desde = useMemo(() => rangoDelDia(sumarDias(claveHoy, -VENTANA_SEGUIMIENTO)).desde, [claveHoy]);
  const consultas = useConsultas({ desde });
  const futuras = useCitas(useMemo(() => ({ desde: rangoDelDia(claveHoy).desde }), [claveHoy]));
  const [agendarA, setAgendarA] = useState<{ id: Guid; nombre: string } | null>(null);

  const pacientes = useMemo(() => {
    if (!consultas.data || !futuras.data) return [];
    const conCita = new Set(
      futuras.data.filter((c) => c.estado === "Programada" || c.estado === "Confirmada").map((c) => c.pacienteId),
    );
    const ultima = new Map<Guid, { nombre: string; fecha: string }>();
    for (const c of consultas.data) {
      if (!c.fechaFin) continue;
      const previa = ultima.get(c.pacienteId);
      if (!previa || previa.fecha < c.fechaFin) ultima.set(c.pacienteId, { nombre: c.pacienteNombre, fecha: c.fechaFin });
    }
    const limite = new Date(rangoDelDia(sumarDias(claveHoy, -DIAS_SIN_VOLVER)).desde).getTime();
    return [...ultima.entries()]
      .filter(([id, u]) => !conCita.has(id) && new Date(u.fecha).getTime() < limite)
      .map(([id, u]) => ({ id, ...u }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [consultas.data, futuras.data, claveHoy]);

  const cargando = consultas.isPending || futuras.isPending;

  return (
    <Seccion
      titulo="Seguimiento"
      icono={HeartHandshake}
      meta={pacientes.length > 0 ? `${pacientes.length} sin volver` : undefined}
    >
      {cargando ? (
        <Skeleton className="h-16 w-full" />
      ) : pacientes.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Todos tus pacientes recientes tienen cita o vinieron hace menos de {DIAS_SIN_VOLVER} días.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground mb-2 text-xs">
            Última consulta hace más de {DIAS_SIN_VOLVER} días y sin cita próxima.
          </p>
          <ul className="divide-border/70 -my-1 divide-y">
            {pacientes.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <Link to={`/pacientes/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <AvatarPaciente nombre={p.nombre} id={p.id} className="size-7 text-[10px]" />
                  <span className="min-w-0">
                    <span className="text-foreground hover:text-primary block truncate text-sm font-medium">{p.nombre}</span>
                    <span className="text-muted-foreground text-xs">Vino {formatearTiempoRelativo(p.fecha)}</span>
                  </span>
                </Link>
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setAgendarA({ id: p.id, nombre: p.nombre })}>
                  Agendar
                </Button>
              </li>
            ))}
          </ul>
          {pacientes.length > 5 && <p className="text-muted-foreground pt-2 text-xs">y {pacientes.length - 5} más</p>}
        </>
      )}

      <DialogoCita
        abierto={agendarA !== null}
        onOpenChange={(abierto) => !abierto && setAgendarA(null)}
        pacienteId={agendarA?.id}
        pacienteNombre={agendarA?.nombre}
      />
    </Seccion>
  );
}
