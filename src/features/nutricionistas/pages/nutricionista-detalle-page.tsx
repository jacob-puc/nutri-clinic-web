import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  IdCard,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Power,
  ShieldAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Seccion } from "@/components/ficha/seccion";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EstadoError } from "@/components/states/estado-error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { DESCRIPCION_ROL, permisosDe } from "@/features/auth/lib/permisos";
import { useCitas } from "@/features/citas/hooks/use-citas";
import { SeccionAusencias } from "@/features/nutricionistas/components/agenda-persona";
import { DialogoHorario } from "@/features/nutricionistas/components/dialogos-horario";
import { resumenSemana } from "@/features/nutricionistas/lib/horario";
import { AvatarPersona, InsigniaRol } from "@/features/nutricionistas/components/comunes";
import { DialogoDesactivar } from "@/features/nutricionistas/components/dialogo-desactivar";
import { DialogoMiPerfil } from "@/features/nutricionistas/components/dialogo-mi-perfil";
import { DialogoNutricionista } from "@/features/nutricionistas/components/dialogo-nutricionista";
import { DialogoRestablecerContrasena } from "@/features/nutricionistas/components/dialogo-restablecer-contrasena";
import {
  primerHueco,
  useCitasPendientesNutricionista,
  useDisponibilidad,
  useHorarios,
  useNutricionista,
  useReactivarNutricionista,
} from "@/features/nutricionistas/hooks/use-nutricionistas";
import { subtituloDe } from "@/features/nutricionistas/lib/equipo";
import { esApiError, mensajeDeError } from "@/lib/api-error";
import { formatearFecha } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { claveDia, formatearCalendario, formatearInstante, hoyEnClinica, rangoDelDia, sumarDias } from "@/lib/zona-horaria";
import type { CitaPendiente, Nutricionista } from "@/types/api";

/** Ficha de una persona del equipo: quien es, su agenda proxima y su acceso. */
export function NutricionistaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const consulta = useNutricionista(id);

  if (consulta.isPending) return <FichaSkeleton />;

  if (consulta.isError || !consulta.data) {
    const noExiste = esApiError(consulta.error) && consulta.error.status === 404;
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <EstadoError
          variante="pagina"
          titulo={noExiste ? "No encontramos a esta persona" : "No pudimos cargar la ficha"}
          mensaje={noExiste ? "La cuenta no existe en el equipo." : mensajeDeError(consulta.error)}
          onReintentar={noExiste ? undefined : consulta.refetch}
        >
          <Button asChild variant="outline">
            <Link to="/nutricionistas">Volver al equipo</Link>
          </Button>
        </EstadoError>
      </div>
    );
  }

  return <Ficha persona={consulta.data} esPropia={consulta.data.id === usuario?.id} />;
}

function Ficha({ persona, esPropia }: { persona: Nutricionista; esPropia: boolean }) {
  const [editando, setEditando] = useState(false);
  const [restableciendo, setRestableciendo] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [miPerfil, setMiPerfil] = useState(false);
  const reactivar = useReactivarNutricionista();
  const atiende = persona.rol !== "Recepcion";

  const reactivarCuenta = () =>
    reactivar.mutate(persona.id, {
      onSuccess: () => toast.success("Cuenta reactivada", { description: `${persona.nombreCompleto} puede volver a entrar.` }),
      onError: (error) => toast.error("No se pudo reactivar", { description: mensajeDeError(error) }),
    });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <Breadcrumbs
        etiquetaNav="Navegación del equipo"
        className="mb-4"
        tramos={[{ etiqueta: "Equipo", href: "/nutricionistas" }, { etiqueta: persona.nombreCompleto }]}
      />

      <section className="hoja overflow-hidden rounded-xl">
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between md:p-6">
          <div className="flex min-w-0 items-start gap-4">
            <AvatarPersona nombre={persona.nombreCompleto} id={persona.id} className="size-16 text-lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                  {persona.nombreCompleto}
                </h1>
                {esPropia && (
                  <span className="bg-surface-muted text-muted-foreground rounded px-1.5 py-0.5 text-[11px] font-semibold">
                    Tú
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5">{subtituloDe(persona)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span title={DESCRIPCION_ROL[persona.rol]}>
                  <InsigniaRol rol={persona.rol} />
                </span>
                <EstadoCuenta persona={persona} />
              </div>
            </div>
          </div>

          {persona.isActive && (
            <Button variant="outline" onClick={() => setEditando(true)} className="self-start">
              <Pencil className="size-4" />
              Editar datos
            </Button>
          )}
        </div>

        <dl
          className={cn(
            "bg-surface-subtle/60 grid gap-x-6 gap-y-3 border-t px-5 py-4 text-sm sm:grid-cols-2 md:px-6",
            atiende ? "lg:grid-cols-5" : "lg:grid-cols-3",
          )}
        >
          <Dato icono={Mail} etiqueta="Correo" valor={persona.correoElectronico} />
          <Dato icono={Phone} etiqueta="Teléfono" valor={persona.telefono} />
          {atiende && <Dato icono={IdCard} etiqueta="Cédula profesional" valor={persona.numeroColegiatura} />}
          {atiende && <DatoHorario persona={persona} editable={persona.isActive} />}
          <Dato icono={CalendarDays} etiqueta="En el equipo desde" valor={formatearFecha(persona.fechaRegistro)} />
        </dl>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Columna principal: lo operativo (agenda, horario, ausencias). */}
        <div className="min-w-0 space-y-6">
          {atiende ? <AgendaProxima persona={persona} /> : <QuePuedeHacer persona={persona} />}
          {atiende && persona.isActive && <SeccionAusencias persona={persona} editable />}
        </div>

        {/* Lateral corto y fijo: la cuenta. Sigue a la vista al bajar. */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Seccion titulo="Acceso" icono={KeyRound}>
            <div>
              <div>
                <p className="text-muted-foreground text-xs">Contraseña</p>
                <p className="text-foreground mt-0.5 text-sm font-semibold">
                  {persona.debeCambiarContrasena ? "Temporal" : "Propia"}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {persona.debeCambiarContrasena
                    ? "Aún no entra por primera vez: al hacerlo elegirá la suya."
                    : "La eligió esta persona; nadie más la conoce."}
                </p>
                {persona.isActive &&
                  (esPropia ? (
                    <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setMiPerfil(true)}>
                      Cambiar mi contraseña
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setRestableciendo(true)}>
                      Restablecer contraseña
                    </Button>
                  ))}
              </div>
            </div>
          </Seccion>

          {!esPropia && (
            <Seccion
              titulo={persona.isActive ? "Desactivar cuenta" : "Cuenta desactivada"}
              icono={persona.isActive ? ShieldAlert : Power}
              tono={persona.isActive ? "destructivo" : "primario"}
            >
              <p className="text-muted-foreground text-sm">
                {persona.isActive
                  ? "Deja de poder entrar y de recibir citas. Su historial se conserva."
                  : "No puede iniciar sesión ni recibir citas. Al reactivarla entra con su misma contraseña."}
              </p>
              {persona.isActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 mt-3 w-full"
                  onClick={() => setDesactivando(true)}
                >
                  Desactivar…
                </Button>
              ) : (
                <Button size="sm" className="mt-3 w-full" onClick={reactivarCuenta} disabled={reactivar.isPending}>
                  Reactivar cuenta
                </Button>
              )}
            </Seccion>
          )}
        </div>
      </div>

      <DialogoNutricionista abierto={editando} onOpenChange={setEditando} persona={persona} esPropia={esPropia} />
      <DialogoRestablecerContrasena abierto={restableciendo} onOpenChange={setRestableciendo} persona={persona} />
      <DialogoDesactivar abierto={desactivando} onOpenChange={setDesactivando} persona={persona} />
      <DialogoMiPerfil abierto={miPerfil} onOpenChange={setMiPerfil} pestanaInicial="contrasena" />
    </div>
  );
}

function EstadoCuenta({ persona }: { persona: Nutricionista }) {
  if (!persona.isActive) {
    return (
      <span className="bg-surface-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-semibold">
        Desactivada
      </span>
    );
  }
  if (persona.debeCambiarContrasena) {
    return (
      <span className="bg-warning-soft text-warning-soft-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
        <KeyRound className="size-3" aria-hidden />
        Acceso pendiente
      </span>
    );
  }
  return (
    <span className="bg-success-soft text-success-soft-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
      <BadgeCheck className="size-3" aria-hidden />
      Activa
    </span>
  );
}

/** Horario en la franja de datos; al hacer clic se edita en su dialogo. */
function DatoHorario({ persona, editable }: { persona: Nutricionista; editable: boolean }) {
  const horarios = useHorarios();
  const [editando, setEditando] = useState(false);
  const datos = horarios.data?.personas.find((p) => p.nutricionistaId === persona.id);
  const filas = datos ? resumenSemana(datos.bloques) : [];
  const texto = horarios.isPending
    ? "…"
    : filas.length > 0
      ? filas.join(" · ")
      : datos?.horarioPropio
        ? "Sin días de atención"
        : "Sin horario";
  const detalle = datos ? `${datos.horarioPropio ? "Propio" : "De la clínica"} · ${datos.duracionConsultaMinutos} min` : null;

  const contenido = (
    <>
      <Clock className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 text-left">
        <dt className="text-muted-foreground flex items-center gap-1 text-xs">
          Horario
          {editable && <Pencil className="size-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />}
        </dt>
        <dd className="text-foreground truncate font-medium tabular-nums">{texto}</dd>
        {detalle && <dd className="text-muted-foreground truncate text-xs">{detalle}</dd>}
      </div>
    </>
  );

  if (!editable || !horarios.data) return <div className="flex min-w-0 items-start gap-2.5">{contenido}</div>;

  return (
    <>
      <button
        type="button"
        onClick={() => setEditando(true)}
        title="Editar horario"
        className="group hover:bg-surface-muted focus-visible:ring-ring -m-1.5 flex min-w-0 items-start gap-2.5 rounded-lg p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {contenido}
      </button>
      <DialogoHorario abierto={editando} onOpenChange={setEditando} persona={persona} horarios={horarios.data} />
    </>
  );
}

function Dato({ icono: Icono, etiqueta, valor }: { icono: typeof Mail; etiqueta: string; valor: string | null }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <Icono className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs">{etiqueta}</dt>
        <dd className={cn("truncate", valor ? "text-foreground font-medium" : "text-muted-foreground-subtle")}>
          {valor || "Sin registrar"}
        </dd>
      </div>
    </div>
  );
}

/** Carga de trabajo: hoy, los proximos 7 dias y la lista de lo que viene. */
function AgendaProxima({ persona }: { persona: Nutricionista }) {
  const pendientes = useCitasPendientesNutricionista(persona.id);
  const rangoHoy = useMemo(() => rangoDelDia(hoyEnClinica()), []);
  const hoy = useCitas({ ...rangoHoy, nutricionistaId: persona.id });

  const citas = pendientes.data ?? [];
  const claveHoy = hoyEnClinica();
  const limiteSemana = sumarDias(claveHoy, 7);
  const deHoy = (hoy.data ?? []).filter((c) => c.estado !== "Cancelada");
  const atendidasHoy = deHoy.filter((c) => c.estado === "Completada").length;
  const semana = citas.filter((c) => claveDia(c.fechaInicio) < limiteSemana).length;
  /* Lo que preguntan al telefono: "¿cuando tiene espacio?". */
  const disponibilidad = useDisponibilidad(persona.id, { desde: claveHoy, hasta: sumarDias(claveHoy, 20) });
  const libre = primerHueco(disponibilidad.data?.dias);

  return (
    <Seccion
      titulo="Agenda próxima"
      icono={CalendarDays}
      meta={pendientes.isSuccess ? `${citas.length} pendientes` : undefined}
      acciones={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/citas">
            Ver agenda
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <Cifra etiqueta="Hoy" valor={hoy.isSuccess ? deHoy.length : null} detalle={hoy.isSuccess ? `${atendidasHoy} atendidas` : undefined} />
        <Cifra etiqueta="Próximos 7 días" valor={pendientes.isSuccess ? semana : null} />
        <Cifra etiqueta="Pendientes" valor={pendientes.isSuccess ? citas.length : null} />
      </div>

      {disponibilidad.isSuccess && (
        <p className="bg-primary-soft/50 text-primary-soft-foreground mt-3 rounded-lg px-3 py-2 text-sm">
          {libre ? (
            <>
              Próximo espacio libre ({disponibilidad.data.duracionMinutos} min):{" "}
              <span className="font-semibold first-letter:uppercase">
                {libre.fecha === claveHoy
                  ? "hoy"
                  : libre.fecha === sumarDias(claveHoy, 1)
                    ? "mañana"
                    : formatearCalendario(libre.fecha, { weekday: "long", day: "numeric", month: "short" })}{" "}
                a las {libre.hora}
              </span>
            </>
          ) : (
            "Sin espacios libres en las próximas tres semanas."
          )}
        </p>
      )}

      <div className="mt-5">
        {pendientes.isPending ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : pendientes.isError ? (
          <p className="text-destructive text-sm">{mensajeDeError(pendientes.error)}</p>
        ) : citas.length === 0 ? (
          <p className="text-muted-foreground bg-surface-subtle rounded-lg px-4 py-6 text-center text-sm">
            No tiene citas por atender.
          </p>
        ) : (
          <ListaPorDia citas={citas.slice(0, 8)} restantes={Math.max(0, citas.length - 8)} />
        )}
      </div>
    </Seccion>
  );
}

function Cifra({ etiqueta, valor, detalle }: { etiqueta: string; valor: number | null; detalle?: string }) {
  return (
    <div className="bg-surface-subtle rounded-lg border px-3 py-2.5">
      <p className="text-muted-foreground text-xs">{etiqueta}</p>
      {valor === null ? (
        <Skeleton className="mt-1 h-7 w-10" />
      ) : (
        <p className="text-foreground text-2xl font-bold tabular-nums">{valor}</p>
      )}
      {detalle && <p className="text-muted-foreground text-[11px]">{detalle}</p>}
    </div>
  );
}

function ListaPorDia({ citas, restantes }: { citas: CitaPendiente[]; restantes: number }) {
  const claveHoy = hoyEnClinica();
  const grupos = new Map<string, CitaPendiente[]>();
  for (const cita of citas) {
    const dia = claveDia(cita.fechaInicio);
    grupos.set(dia, [...(grupos.get(dia) ?? []), cita]);
  }

  return (
    <div className="space-y-4">
      {[...grupos.entries()].map(([dia, lista]) => (
        <div key={dia}>
          <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
            {dia === claveHoy
              ? "Hoy"
              : dia === sumarDias(claveHoy, 1)
                ? "Mañana"
                : formatearInstante(lista[0]?.fechaInicio, { weekday: "long", day: "numeric", month: "short" })}
          </p>
          <ul className="divide-border/70 divide-y rounded-lg border">
            {lista.map((cita) => (
              <li key={cita.id}>
                <Link
                  to={`/citas/${cita.id}`}
                  className="hover:bg-accent group flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
                >
                  <span className="text-foreground w-12 shrink-0 font-semibold tabular-nums">
                    {formatearInstante(cita.fechaInicio, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-foreground min-w-0 flex-1 truncate">{cita.pacienteNombre}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      cita.estado === "Confirmada"
                        ? "bg-success-soft text-success-soft-foreground"
                        : "bg-surface-muted text-muted-foreground",
                    )}
                  >
                    {cita.estado === "Confirmada" ? "Confirmada" : "Por confirmar"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {restantes > 0 && <p className="text-muted-foreground text-xs">y {restantes} más en la agenda.</p>}
    </div>
  );
}

/** Para recepcion: deja claro que ve y que no, que es lo que suele preguntarse. */
function QuePuedeHacer({ persona }: { persona: Nutricionista }) {
  const permisos = permisosDe(persona.rol);
  const filas: Array<{ texto: string; puede: boolean }> = [
    { texto: "Registrar y editar pacientes", puede: true },
    { texto: "Agendar, confirmar y mover citas", puede: true },
    { texto: "Cobrar consultas y emitir facturas", puede: true },
    { texto: "Ver expedientes, notas y medidas", puede: permisos.verClinico },
    { texto: "Atender consultas y armar planes", puede: permisos.atiende },
    { texto: "Gestionar el equipo y los datos de la clínica", puede: permisos.gestionarEquipo },
  ];
  return (
    <Seccion titulo="Qué puede hacer" icono={ShieldAlert}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {filas.map((fila) => (
          <li key={fila.texto} className="flex items-start gap-2.5 text-sm">
            <span
              className={cn(
                "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full",
                fila.puede ? "bg-success-soft text-success-soft-foreground" : "bg-surface-muted text-muted-foreground",
              )}
              aria-hidden
            >
              {fila.puede ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
            </span>
            <span className={fila.puede ? "text-foreground" : "text-muted-foreground"}>
              <span className="sr-only">{fila.puede ? "Puede: " : "No puede: "}</span>
              {fila.texto}
            </span>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

function FichaSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
