import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, CalendarCheck2, CalendarOff, KeyRound, Mail, Phone, Search, UserPlus, Users } from "lucide-react";

import { EstadoError } from "@/components/states/estado-error";
import { EstadoVacio } from "@/components/states/estado-vacio";
import { Button } from "@/components/ui/button";
import { TooltipSimple } from "@/components/ui/tooltip-simple";
import { Input } from "@/components/ui/input";
import { Segmentado } from "@/components/ui/segmentado";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { atiendePacientes } from "@/features/auth/lib/permisos";
import { useCitas } from "@/features/citas/hooks/use-citas";
import { AvatarPersona, InsigniaRol } from "@/features/nutricionistas/components/comunes";
import { DialogoNutricionista } from "@/features/nutricionistas/components/dialogo-nutricionista";
import { DialogoHorarioClinica } from "@/features/nutricionistas/components/dialogos-horario";
import { useAusencias, useHorarios, useNutricionistas } from "@/features/nutricionistas/hooks/use-nutricionistas";
import { bloquesDelDia, diaDeClave, diaNoDisponible, reglasDe, textoBloques, type ReglasAgenda } from "@/features/nutricionistas/lib/horario";
import { subtituloDe } from "@/features/nutricionistas/lib/equipo";
import { mensajeDeError } from "@/lib/api-error";
import { normalizar } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { formatearInstante, hoyEnClinica, rangoDelDia } from "@/lib/zona-horaria";
import type { Cita, Nutricionista } from "@/types/api";

type Vista = "activos" | "inactivos";

/**
 * El equipo de la clinica en tarjetas: es un grupo chico y lo que importa de
 * un vistazo es quien atiende hoy, con que rol y si ya activo su cuenta.
 */
export function NutricionistasPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [vista, setVista] = useState<Vista>("activos");
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [horarioClinica, setHorarioClinica] = useState(false);
  const horarios = useHorarios();
  const ausencias = useAusencias();

  const consulta = useNutricionistas(true);
  const rangoHoy = useMemo(() => rangoDelDia(hoyEnClinica()), []);
  const citasHoy = useCitas(rangoHoy);

  const termino = normalizar(busqueda);
  const todos = consulta.data ?? [];
  const activos = todos.filter((p) => p.isActive);
  const inactivos = todos.filter((p) => !p.isActive);
  const visibles = (vista === "activos" ? activos : inactivos).filter(
    (p) =>
      normalizar(p.nombreCompleto).includes(termino) ||
      normalizar(p.correoElectronico).includes(termino) ||
      normalizar(p.especialidad ?? "").includes(termino),
  );

  const citasPorPersona = useMemo(() => {
    const mapa = new Map<string, Cita[]>();
    for (const cita of citasHoy.data ?? []) {
      if (cita.estado === "Cancelada") continue;
      const lista = mapa.get(cita.nutricionistaId) ?? [];
      lista.push(cita);
      mapa.set(cita.nutricionistaId, lista);
    }
    for (const lista of mapa.values()) lista.sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
    return mapa;
  }, [citasHoy.data]);

  const atienden = activos.filter(atiendePacientes).length;
  const recepcion = activos.length - atienden;
  const totalHoy = [...citasPorPersona.values()].reduce((s, l) => s + l.length, 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">Equipo</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {consulta.isSuccess ? (
              <>
                {atienden} {atienden === 1 ? "persona atiende" : "personas atienden"}
                {recepcion > 0 && <> · {recepcion} en recepción</>} · {totalHoy}{" "}
                {totalHoy === 1 ? "cita" : "citas"} hoy
              </>
            ) : (
              "Quién atiende en la clínica, con qué rol y cómo va su día."
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setHorarioClinica(true)} disabled={!horarios.data}>
            <Building2 className="size-4" />
            Horario de la clínica
          </Button>
          <Button onClick={() => setCreando(true)}>
            <UserPlus className="size-4" />
            Agregar al equipo
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmentado
          aria-label="Mostrar"
          className="sm:w-72"
          value={vista}
          onChange={setVista}
          opciones={[
            { valor: "activos", etiqueta: `Activos${consulta.isSuccess ? ` · ${activos.length}` : ""}` },
            { valor: "inactivos", etiqueta: `Inactivos${consulta.isSuccess ? ` · ${inactivos.length}` : ""}` },
          ]}
        />
        <div className="relative sm:w-72">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="bg-card h-10 pl-9"
            aria-label="Buscar en el equipo"
          />
        </div>
      </div>

      <div className="mt-5">
        {consulta.isPending && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        )}

        {consulta.isError && (
          <EstadoError
            titulo="No pudimos cargar el equipo"
            mensaje={mensajeDeError(consulta.error)}
            onReintentar={consulta.refetch}
          />
        )}

        {consulta.isSuccess && visibles.length === 0 && (
          <EstadoVacio
            icono={busqueda ? Search : Users}
            titulo={busqueda ? "Sin coincidencias" : vista === "activos" ? "Aún no hay equipo" : "Nadie desactivado"}
            descripcion={
              busqueda
                ? `Nadie del equipo coincide con "${busqueda}".`
                : vista === "activos"
                  ? "Agrega a los nutricionistas y a recepción para repartir la agenda."
                  : "Las cuentas que desactives aparecen aquí y se pueden reactivar."
            }
          />
        )}

        {visibles.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibles.map((persona) => (
              <li key={persona.id}>
                <TarjetaPersona
                  persona={persona}
                  esPropia={persona.id === usuario?.id}
                  citasHoy={citasPorPersona.get(persona.id) ?? []}
                  reglas={horarios.data ? reglasDe(persona.id, horarios.data, ausencias.data) : null}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <DialogoNutricionista
        abierto={creando}
        onOpenChange={setCreando}
        onCreada={(persona) => navigate(`/nutricionistas/${persona.id}`)}
      />
      {horarios.data && (
        <DialogoHorarioClinica abierto={horarioClinica} onOpenChange={setHorarioClinica} horarios={horarios.data} />
      )}
    </div>
  );
}

function TarjetaPersona({
  persona,
  esPropia,
  citasHoy,
  reglas,
}: {
  persona: Nutricionista;
  esPropia: boolean;
  citasHoy: Cita[];
  reglas: ReglasAgenda | null;
}) {
  const atiende = persona.rol !== "Recepcion";
  const hoy = hoyEnClinica();
  /* Ausente o sin atencion hoy pesa mas que el conteo de citas. */
  const noAtiendeHoy = atiende && reglas ? diaNoDisponible(reglas, hoy) : null;
  const horarioHoy = reglas?.restringe ? textoBloques(bloquesDelDia(reglas.bloques, diaDeClave(hoy))) : "";
  const ahora = new Date().toISOString();
  const siguiente = citasHoy.find(
    (c) => c.fechaFin > ahora && (c.estado === "Programada" || c.estado === "Confirmada" || c.estado === "EnCurso"),
  );
  const enConsulta = citasHoy.some((c) => c.estado === "EnCurso");

  return (
    <Link
      to={`/nutricionistas/${persona.id}`}
      className={cn(
        "hoja group flex h-full flex-col overflow-hidden rounded-xl transition-shadow outline-none",
        "hover:shadow-[0_12px_28px_-16px_rgb(0_0_0/0.25)] focus-visible:ring-primary/30 focus-visible:ring-[3px]",
        !persona.isActive && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3.5 p-5">
        <div className="relative">
          <AvatarPersona nombre={persona.nombreCompleto} id={persona.id} className="size-12 text-sm" />
          {enConsulta && (
            <TooltipSimple contenido="En consulta ahora">
              <span className="bg-success ring-card absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full ring-2" />
            </TooltipSimple>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-foreground group-hover:text-primary truncate font-semibold transition-colors">
              {persona.nombreCompleto}
            </p>
            {esPropia && (
              <span className="bg-surface-muted text-muted-foreground shrink-0 rounded px-1.5 py-px text-[10px] font-semibold">
                Tú
              </span>
            )}
          </div>
          <p className="text-muted-foreground truncate text-sm">{subtituloDe(persona)}</p>
          <InsigniaRol rol={persona.rol} className="mt-2" />
        </div>
      </div>

      <dl className="text-muted-foreground space-y-1.5 px-5 pb-4 text-sm">
        <div className="flex items-center gap-2">
          <Mail className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Correo</dt>
          <dd className="truncate">{persona.correoElectronico}</dd>
        </div>
        {persona.telefono && (
          <div className="flex items-center gap-2">
            <Phone className="size-3.5 shrink-0" aria-hidden />
            <dt className="sr-only">Teléfono</dt>
            <dd className="tabular-nums">{persona.telefono}</dd>
          </div>
        )}
      </dl>

      <div className="bg-surface-subtle/70 mt-auto flex min-h-12 items-center gap-2 border-t px-5 py-2.5 text-sm">
        {!persona.isActive ? (
          <span className="text-muted-foreground">Cuenta desactivada</span>
        ) : persona.debeCambiarContrasena ? (
          <span className="text-warning-soft-foreground flex items-center gap-1.5 font-medium">
            <KeyRound className="size-3.5" aria-hidden />
            Aún no entra por primera vez
          </span>
        ) : !atiende ? (
          <span className="text-muted-foreground">Agenda citas y cobra</span>
        ) : noAtiendeHoy && citasHoy.length === 0 ? (
          <span className="text-muted-foreground flex min-w-0 items-center gap-1.5">
            <CalendarOff className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{noAtiendeHoy}</span>
          </span>
        ) : citasHoy.length === 0 ? (
          <span className="text-muted-foreground truncate">
            Sin citas hoy{horarioHoy && <> · atiende {horarioHoy}</>}
          </span>
        ) : (
          <span className="flex min-w-0 items-center gap-1.5">
            <CalendarCheck2 className="text-primary size-3.5 shrink-0" aria-hidden />
            <span className="text-foreground shrink-0 font-semibold tabular-nums">
              {citasHoy.length} {citasHoy.length === 1 ? "cita" : "citas"} hoy
            </span>
            {siguiente && (
              <span className="text-muted-foreground truncate">
                · {siguiente.estado === "EnCurso" ? "atendiendo a" : formatearInstante(siguiente.fechaInicio, { hour: "2-digit", minute: "2-digit" })}{" "}
                {siguiente.pacienteNombre.split(" ")[0]}
              </span>
            )}
          </span>
        )}
      </div>
    </Link>
  );
}
