import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sun,
  Sunrise,
  Sunset,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Segmentado } from "@/components/ui/segmentado";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertaFormulario } from "@/components/ui/grupo-campos";
import { AvatarPersona } from "@/features/nutricionistas/components/comunes";
import { reservasApi } from "@/features/reservas/api/reservas-api";
import { SitioPublico } from "@/features/sitio/components/sitio-publico";
import { useOpcionesPublicas } from "@/features/sitio/hooks/use-opciones-publicas";
import { esConflicto, erroresPorCampo } from "@/lib/errores-formulario";
import { mensajeDeError } from "@/lib/api-error";
import { formatearCalendario, formatearInstante, hoyEnClinica, sumarDias } from "@/lib/zona-horaria";
import { cn } from "@/lib/utils";
import type {
  ClinicaPublica,
  DiaPublico,
  HoraPublica,
  OpcionesReserva,
  ProfesionalPublico,
  ReservaConfirmada,
  Sexo,
} from "@/types/api";

/**
 * Reservacion en linea, sin cuenta. Tres pasos (con quien, cuando, tus datos)
 * y una confirmacion. La cita entra como "por confirmar": el equipo la ve en
 * la agenda y el resumen con la etiqueta "En linea".
 */

type Paso = "profesional" | "horario" | "datos" | "listo";

/** null = con quien este disponible. */
type Eleccion = { profesional: ProfesionalPublico | null };

interface HoraElegida extends HoraPublica {
  fecha: string;
}

export function ReservarPage() {
  const opciones = useOpcionesPublicas();

  return (
    <SitioPublico>
      <main className="mx-auto w-full max-w-[84rem] px-4 pt-8 pb-20">
        {opciones.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-80" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        ) : opciones.isError ? (
          <div className="mx-auto max-w-md space-y-4 py-16 text-center">
            <p className="text-lg font-semibold">No pudimos cargar la reservación</p>
            <p className="text-muted-foreground text-sm">{mensajeDeError(opciones.error)}</p>
            <Button variant="outline" onClick={() => opciones.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : opciones.data.profesionales.length === 0 ? (
          <div className="mx-auto max-w-md space-y-2 py-16 text-center">
            <p className="text-lg font-semibold">Por ahora no hay reservación en línea</p>
            <p className="text-muted-foreground text-sm">Comunícate con la clínica para agendar tu cita.</p>
          </div>
        ) : (
          <Asistente opciones={opciones.data} />
        )}
      </main>
    </SitioPublico>
  );
}

function Asistente({ opciones }: { opciones: OpcionesReserva }) {
  const unico = opciones.profesionales.length === 1 ? opciones.profesionales[0]! : null;
  /* "Reservar con ..." desde la pagina de inicio llega con ?profesional=id. */
  const [params] = useSearchParams();
  const preelegido = unico ?? opciones.profesionales.find((p) => p.id === params.get("profesional")) ?? null;
  const [paso, setPaso] = useState<Paso>(preelegido ? "horario" : "profesional");
  const [eleccion, setEleccion] = useState<Eleccion>({ profesional: preelegido });
  const [hora, setHora] = useState<HoraElegida | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmada, setConfirmada] = useState<ReservaConfirmada | null>(null);

  const pasos: { id: Paso; etiqueta: string }[] = [
    ...(unico ? [] : [{ id: "profesional" as const, etiqueta: "Profesional" }]),
    { id: "horario", etiqueta: "Fecha y hora" },
    { id: "datos", etiqueta: "Tus datos" },
  ];

  if (paso === "listo" && confirmada) {
    return (
      <Confirmacion
        reserva={confirmada}
        onOtra={() => {
          setConfirmada(null);
          setHora(null);
          setEleccion({ profesional: unico });
          setPaso(unico ? "horario" : "profesional");
        }}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <PanelReserva
        pasos={pasos}
        actual={paso}
        profesional={paso === "profesional" ? undefined : eleccion.profesional}
        hora={hora}
      />

      {/* La llave repite la entrada al cambiar de paso. */}
      <div key={paso} className="anim-vista min-w-0">
      {paso === "profesional" && (
        <PasoProfesional
          profesionales={opciones.profesionales}
          onElegir={(profesional) => {
            setEleccion({ profesional });
            setHora(null);
            setPaso("horario");
          }}
        />
      )}

      {paso === "horario" && (
        <PasoHorario
          opciones={opciones}
          profesional={eleccion.profesional}
          horaElegida={hora}
          aviso={aviso}
          onCambiarProfesional={unico ? undefined : () => setPaso("profesional")}
          onElegir={(h) => {
            setHora(h);
            setAviso(null);
            setPaso("datos");
          }}
        />
      )}

      {paso === "datos" && hora && (
        <PasoDatos
          profesional={eleccion.profesional}
          hora={hora}
          onVolver={() => setPaso("horario")}
          onOcupada={(mensaje) => {
            setAviso(mensaje);
            setHora(null);
            setPaso("horario");
          }}
          onListo={(reserva) => {
            setConfirmada(reserva);
            setPaso("listo");
            window.scrollTo({ top: 0 });
          }}
        />
      )}
      </div>
    </div>
  );
}

/** Panel fijo: en que paso vas y como va quedando tu cita. */
function PanelReserva({
  pasos,
  actual,
  profesional,
  hora,
}: {
  pasos: { id: Paso; etiqueta: string }[];
  actual: Paso;
  /** undefined: aun no se elige; null: con quien este disponible. */
  profesional: ProfesionalPublico | null | undefined;
  hora: HoraElegida | null;
}) {
  return (
    <aside className="banda-equipo rounded-[2rem] p-7 text-white sm:p-9 lg:sticky lg:top-6">
      <h1 className="font-editorial text-4xl leading-[1.05] font-normal tracking-tight sm:text-5xl">Reserva tu cita</h1>
      <p className="mt-3 text-lg text-pretty text-white/75">
        Elige el horario que te acomode; te contactaremos para confirmarla.
      </p>

      <div className="mt-7">
        <Indicador pasos={pasos} actual={actual} />
      </div>

      {profesional !== undefined && (
        <dl className="mt-7 space-y-3 border-t border-white/15 pt-6">
          <DatoCita etiqueta="Con">{profesional?.nombre ?? "Quien esté disponible"}</DatoCita>
          {hora && (
            <>
              <DatoCita etiqueta="Día">
                <span className="block first-letter:uppercase">
                  {formatearCalendario(hora.fecha, { weekday: "long", day: "numeric", month: "long" })}
                </span>
              </DatoCita>
              <DatoCita etiqueta="Hora">
                {hora.hora} h{profesional && ` · ${profesional.duracionMinutos} min`}
              </DatoCita>
            </>
          )}
        </dl>
      )}
    </aside>
  );
}

function DatoCita({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-2">
      <dt className="text-white/60">{etiqueta}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function Indicador({ pasos, actual }: { pasos: { id: Paso; etiqueta: string }[]; actual: Paso }) {
  const indice = pasos.findIndex((p) => p.id === actual);
  return (
    <ol className="flex gap-3 lg:flex-col">
      {pasos.map((p, i) => {
        const hecho = i < indice;
        const activo = i === indice;
        return (
          <li key={p.id} aria-current={activo ? "step" : undefined} className="flex items-center gap-3">
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors",
                hecho && "bg-white/20 text-white",
                activo && "bg-white text-[var(--brand-900)]",
                !hecho && !activo && "text-white/60 ring-1 ring-white/25",
              )}
            >
              {hecho ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className={cn("hidden text-base font-medium sm:inline", activo ? "text-white" : "text-white/65")}>
              {p.etiqueta}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const TITULO_PASO = "font-editorial text-3xl leading-tight font-normal tracking-tight sm:text-4xl";

/* ---------- Paso 1: con quien ---------- */

const TINTES = ["tinte-durazno", "tinte-menta", "tinte-arena"];

function PasoProfesional({
  profesionales,
  onElegir,
}: {
  profesionales: ProfesionalPublico[];
  onElegir: (p: ProfesionalPublico | null) => void;
}) {
  return (
    <section className="space-y-5">
      <h2 className={TITULO_PASO}>¿Con quién quieres tu cita?</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <Tarjeta tinte="tinte-marca" onClick={() => onElegir(null)}>
          <span className="bg-primary text-primary-foreground grid size-16 place-items-center rounded-full">
            <Users className="size-7" aria-hidden />
          </span>
          <span className="font-editorial mt-5 block text-2xl leading-tight">Con quien esté disponible</span>
          <span className="text-foreground/70 mt-1 block text-base">Más horarios para elegir</span>
        </Tarjeta>
        {profesionales.map((p, i) => (
          <Tarjeta key={p.id} tinte={TINTES[i % TINTES.length]!} onClick={() => onElegir(p)}>
            <AvatarPersona nombre={p.nombre} id={p.id} className="size-16 text-lg" />
            <span className="font-editorial mt-5 block text-2xl leading-tight">{p.nombre}</span>
            <span className="text-foreground/70 mt-1 block text-base">
              {p.especialidad ?? "Nutrición"} · {p.duracionMinutos} min
            </span>
          </Tarjeta>
        ))}
      </div>
    </section>
  );
}

function Tarjeta({ tinte, onClick, children }: { tinte: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "anim-entrada tarjeta-viva group focus-visible:ring-ring relative flex cursor-pointer flex-col items-start overflow-hidden rounded-[1.75rem] p-7 text-left focus-visible:ring-2 focus-visible:outline-none",
        tinte,
      )}
    >
      {children}
      <ChevronRight
        className="text-foreground/60 absolute top-7 right-7 size-6 transition-transform duration-300 group-hover:translate-x-1"
        aria-hidden
      />
    </button>
  );
}

/* ---------- Paso 2: cuando ---------- */

const FRANJAS: { titulo: string; icono: LucideIcon; desde: string; hasta: string }[] = [
  { titulo: "Mañana", icono: Sunrise, desde: "00:00", hasta: "12:00" },
  { titulo: "Tarde", icono: Sun, desde: "12:00", hasta: "18:00" },
  { titulo: "Noche", icono: Sunset, desde: "18:00", hasta: "24:00" },
];

function PasoHorario({
  opciones,
  profesional,
  horaElegida,
  aviso,
  onCambiarProfesional,
  onElegir,
}: {
  opciones: OpcionesReserva;
  profesional: ProfesionalPublico | null;
  horaElegida: HoraElegida | null;
  aviso: string | null;
  onCambiarProfesional?: () => void;
  onElegir: (h: HoraElegida) => void;
}) {
  const hoy = hoyEnClinica();
  const limite = sumarDias(hoy, opciones.diasMaximos);
  const [semana, setSemana] = useState(horaElegida ? horaElegida.fecha : hoy);
  const [diaElegido, setDiaElegido] = useState<string | null>(horaElegida?.fecha ?? null);
  const finSemana = sumarDias(semana, 6);

  const disponibilidad = useQuery({
    queryKey: ["reserva", "disponibilidad", profesional?.id ?? "equipo", semana],
    queryFn: () =>
      reservasApi.disponibilidad({
        desde: semana,
        hasta: finSemana < limite ? finSemana : limite,
        nutricionistaId: profesional?.id,
      }),
    staleTime: 30_000,
  });

  const dias: DiaPublico[] = disponibilidad.data ?? [];
  const activo = dias.find((d) => d.fecha === diaElegido) ?? dias.find((d) => d.horas.length > 0) ?? dias[0];
  const semanaVacia = disponibilidad.isSuccess && dias.every((d) => d.horas.length === 0);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={TITULO_PASO}>¿Cuándo te acomoda?</h2>
        {onCambiarProfesional && (
          <Button variant="ghost" size="sm" onClick={onCambiarProfesional}>
            <ArrowLeft className="size-4" aria-hidden /> Cambiar profesional
          </Button>
        )}
      </div>

      {aviso && <AlertaFormulario>{aviso}</AlertaFormulario>}

      <div className="bg-card rounded-[1.75rem] p-4 sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Semana anterior"
            disabled={semana <= hoy}
            onClick={() => {
              const anterior = sumarDias(semana, -7);
              setSemana(anterior < hoy ? hoy : anterior);
              setDiaElegido(null);
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-base font-semibold first-letter:uppercase">
            {formatearCalendario(semana, { day: "numeric", month: "short" })} –{" "}
            {formatearCalendario(finSemana, { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <Button
            variant="outline"
            size="icon"
            aria-label="Semana siguiente"
            disabled={sumarDias(semana, 7) > limite}
            onClick={() => {
              setSemana(sumarDias(semana, 7));
              setDiaElegido(null);
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
          {Array.from({ length: 7 }, (_, i) => sumarDias(semana, i)).map((fecha) => {
            const dia = dias.find((d) => d.fecha === fecha);
            const libres = dia?.horas.length ?? 0;
            const seleccionado = activo?.fecha === fecha;
            return (
              <button
                key={fecha}
                type="button"
                disabled={!dia || libres === 0}
                onClick={() => setDiaElegido(fecha)}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1 rounded-2xl px-0.5 py-3 text-center transition-colors sm:py-4",
                  seleccionado ? "bg-primary text-primary-foreground" : "bg-surface-subtle hover:bg-primary-soft",
                  "disabled:hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                <span className="text-xs font-medium uppercase opacity-80">
                  {formatearCalendario(fecha, { weekday: "short" }).replace(".", "")}
                </span>
                <span className="font-editorial text-2xl leading-none sm:text-3xl">{formatearCalendario(fecha, { day: "numeric" })}</span>
                <span className={cn("text-[11px] sm:text-xs", seleccionado ? "opacity-90" : "text-muted-foreground")}>
                  {disponibilidad.isPending ? (
                    "·"
                  ) : libres > 0 ? (
                    <>
                      {libres}
                      <span className="hidden sm:inline"> libres</span>
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {disponibilidad.isPending ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-20" />
          ))}
        </div>
      ) : disponibilidad.isError ? (
        <AlertaFormulario>{mensajeDeError(disponibilidad.error)}</AlertaFormulario>
      ) : semanaVacia ? (
        <div className="border-border text-muted-foreground space-y-3 rounded-xl border border-dashed p-6 text-center text-sm">
          <p>No hay horarios libres esta semana.</p>
          {sumarDias(semana, 7) <= limite && (
            <Button variant="outline" size="sm" onClick={() => setSemana(sumarDias(semana, 7))}>
              Ver la siguiente semana <ChevronRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      ) : (
        activo && (
          <div key={activo.fecha} className="anim-vista space-y-5">
            <p className="font-editorial text-2xl first-letter:uppercase">
              {formatearCalendario(activo.fecha, { weekday: "long", day: "numeric", month: "long" })}
            </p>
            {FRANJAS.map((franja) => {
              const horas = activo.horas.filter((h) => h.hora >= franja.desde && h.hora < franja.hasta);
              if (horas.length === 0) return null;
              const Icono = franja.icono;
              return (
                <div key={franja.titulo} className="space-y-2">
                  <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                    <Icono className="size-4" aria-hidden /> {franja.titulo}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {horas.map((h) => (
                      <button
                        key={h.inicio}
                        type="button"
                        onClick={() => onElegir({ ...h, fecha: activo.fecha })}
                        className={cn(
                          "bg-card hover:bg-primary hover:text-primary-foreground h-12 min-w-24 cursor-pointer rounded-full px-5 text-base font-semibold tabular-nums transition-colors",
                          horaElegida?.inicio === h.inicio && "bg-primary text-primary-foreground",
                        )}
                      >
                        {h.hora}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      <p className="text-muted-foreground text-sm">
        Horarios en hora del centro de México. Reserva con al menos {opciones.anticipacionHoras} horas de anticipación.
      </p>
    </section>
  );
}

/* ---------- Paso 3: datos ---------- */

const esquema = z.object({
  nombreCompleto: z.string().trim().min(3, "Escribe tu nombre completo.").max(100),
  telefono: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^\+?[0-9]{10,15}$/, "Escribe tu teléfono a 10 dígitos.")),
  correoElectronico: z.string().trim().email("Escribe un correo válido.").max(150),
  sexo: z.enum(["F", "M", "Otro"], { message: "Elige una opción." }),
  motivo: z.string().trim().max(300, "Máximo 300 caracteres.").optional(),
  sitio: z.string().optional(),
});

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

function PasoDatos({
  profesional,
  hora,
  onVolver,
  onOcupada,
  onListo,
}: {
  profesional: ProfesionalPublico | null;
  hora: HoraElegida;
  onVolver: () => void;
  onOcupada: (mensaje: string) => void;
  onListo: (r: ReservaConfirmada) => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquema),
    defaultValues: { nombreCompleto: "", telefono: "", correoElectronico: "", motivo: "", sitio: "" },
  });

  const reservar = useMutation({
    mutationFn: reservasApi.crear,
    onSuccess: onListo,
    onError: (e) => {
      if (esConflicto(e)) {
        void queryClient.invalidateQueries({ queryKey: ["reserva", "disponibilidad"] });
        /* Ocupada: se elige otra hora. Datos repetidos: se queda aqui. */
        if (e.message.includes("horario")) onOcupada(e.message);
        else setError(e.message);
        return;
      }
      const porCampo = erroresPorCampo(e);
      for (const [campo, mensaje] of Object.entries(porCampo)) {
        form.setError(campo as keyof Entrada, { message: mensaje });
      }
      setError(Object.keys(porCampo).length > 0 ? null : mensajeDeError(e));
    },
  });

  const enviar = form.handleSubmit((datos) => {
    setError(null);
    reservar.mutate({
      nutricionistaId: profesional?.id ?? null,
      inicio: hora.inicio,
      nombreCompleto: datos.nombreCompleto,
      telefono: datos.telefono,
      correoElectronico: datos.correoElectronico,
      sexo: datos.sexo as Sexo,
      motivo: datos.motivo || null,
      sitio: datos.sitio,
    });
  });

  const errores = form.formState.errors;

  return (
    <section className="space-y-5">
      <h2 className={TITULO_PASO}>Tus datos</h2>
      <form onSubmit={enviar} noValidate className="bg-card relative space-y-5 rounded-[1.75rem] p-6 sm:p-8">
        {error && <AlertaFormulario>{error}</AlertaFormulario>}

        <Campo id="nombreCompleto" etiqueta="Nombre completo" error={errores.nombreCompleto?.message}>
          <Input id="nombreCompleto" autoComplete="name" {...form.register("nombreCompleto")} />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="telefono" etiqueta="Teléfono (WhatsApp)" error={errores.telefono?.message}>
            <Input id="telefono" type="tel" inputMode="tel" autoComplete="tel" placeholder="9991234567" {...form.register("telefono")} />
          </Campo>
          <Campo id="correoElectronico" etiqueta="Correo" error={errores.correoElectronico?.message}>
            <Input id="correoElectronico" type="email" autoComplete="email" {...form.register("correoElectronico")} />
          </Campo>
        </div>

        <Campo id="sexo" etiqueta="Sexo" error={errores.sexo?.message}>
          <Controller
            control={form.control}
            name="sexo"
            render={({ field }) => (
              <Segmentado
                id="sexo"
                aria-label="Sexo"
                value={field.value}
                onChange={field.onChange}
                opciones={[
                  { valor: "F", etiqueta: "Mujer" },
                  { valor: "M", etiqueta: "Hombre" },
                  { valor: "Otro", etiqueta: "Otro" },
                ]}
              />
            )}
          />
        </Campo>

        <Campo id="motivo" etiqueta="Motivo de la consulta (opcional)" error={errores.motivo?.message}>
          <Textarea id="motivo" rows={3} placeholder="Ej. bajar de peso, plan para diabetes, primera consulta…" {...form.register("motivo")} />
        </Campo>

        {/* Trampa para bots: fuera de la vista y del teclado. */}
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
          <label htmlFor="sitio">Sitio web</label>
          <input id="sitio" tabIndex={-1} autoComplete="off" {...form.register("sitio")} />
        </div>

        <p className="text-muted-foreground text-sm">
          Usaremos tus datos solo para gestionar tu cita y contactarte sobre ella.
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={onVolver} disabled={reservar.isPending}>
            <ArrowLeft className="size-4" aria-hidden /> Cambiar horario
          </Button>
          <Button type="submit" size="lg" disabled={reservar.isPending}>
            {reservar.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CalendarCheck2 className="size-4" aria-hidden />}
            Reservar cita
          </Button>
        </div>
      </form>
    </section>
  );
}

function Campo({ id, etiqueta, error, children }: { id: string; etiqueta: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

/* ---------- Confirmacion ---------- */

function Confirmacion({ reserva, onOtra }: { reserva: ReservaConfirmada; onOtra: () => void }) {
  return (
    <div className="tinte-menta anim-entrada mx-auto max-w-3xl space-y-7 rounded-[2.5rem] p-7 text-center sm:p-12">
      <span className="bg-primary text-primary-foreground mx-auto grid size-20 place-items-center rounded-full">
        <Check className="size-10" strokeWidth={2.5} aria-hidden />
      </span>
      <div className="space-y-3">
        <h1 className="font-editorial text-4xl leading-tight font-normal tracking-tight sm:text-5xl">
          ¡Listo! Tu cita quedó <em className="text-primary font-normal">registrada</em>
        </h1>
        <p className="text-foreground/70 mx-auto max-w-md text-lg text-pretty">
          La clínica te contactará para confirmarla. Si necesitas cambiarla, comunícate con nosotros.
        </p>
      </div>

      <div className="bg-card space-y-3 rounded-[1.75rem] p-6 text-left">
        <p className="font-editorial text-2xl first-letter:uppercase">
          {formatearInstante(reserva.fechaInicio, { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <p className="flex items-center gap-2 text-sm">
          <Clock className="text-muted-foreground size-4" aria-hidden />
          {formatearInstante(reserva.fechaInicio, { hour: "2-digit", minute: "2-digit", hour12: false })} –{" "}
          {formatearInstante(reserva.fechaFin, { hour: "2-digit", minute: "2-digit", hour12: false })} h
        </p>
        <p className="flex items-center gap-2 text-sm">
          <Users className="text-muted-foreground size-4" aria-hidden /> {reserva.nutricionistaNombre}
        </p>
        <DatosClinica clinica={reserva.clinica} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button variant="outline" onClick={() => descargarIcs(reserva)}>
          <CalendarPlus className="size-4" aria-hidden /> Agregar a mi calendario
        </Button>
        <Button variant="ghost" onClick={onOtra}>
          Hacer otra reservación
        </Button>
      </div>
    </div>
  );
}

function DatosClinica({ clinica }: { clinica: ClinicaPublica }) {
  return (
    <div className="border-border text-muted-foreground space-y-1.5 border-t pt-3 text-sm">
      <p className="text-foreground font-medium">{clinica.nombre}</p>
      {clinica.direccion && (
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {clinica.direccion}
        </p>
      )}
      {clinica.telefono && (
        <a href={`tel:${clinica.telefono}`} className="hover:text-foreground flex items-center gap-2">
          <Phone className="size-4" aria-hidden /> {clinica.telefono}
        </a>
      )}
      {clinica.correo && (
        <a href={`mailto:${clinica.correo}`} className="hover:text-foreground flex items-center gap-2">
          <Mail className="size-4" aria-hidden /> {clinica.correo}
        </a>
      )}
    </div>
  );
}

/** Evento .ics para que el paciente la guarde en su calendario (Google, Apple, Outlook). */
function descargarIcs(reserva: ReservaConfirmada) {
  const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const escapar = (texto: string) => texto.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NutriClinica//Reservacion//ES",
    "BEGIN:VEVENT",
    `UID:${utc(reserva.fechaInicio)}-${Math.random().toString(36).slice(2)}@nutriclinica`,
    `DTSTAMP:${utc(new Date().toISOString())}`,
    `DTSTART:${utc(reserva.fechaInicio)}`,
    `DTEND:${utc(reserva.fechaFin)}`,
    `SUMMARY:${escapar(`Consulta de nutrición · ${reserva.clinica.nombre}`)}`,
    `DESCRIPTION:${escapar(`Con ${reserva.nutricionistaNombre}. Por confirmar por la clínica.`)}`,
    ...(reserva.clinica.direccion ? [`LOCATION:${escapar(reserva.clinica.direccion)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const url = URL.createObjectURL(new Blob([lineas.join("\r\n")], { type: "text/calendar" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "cita-nutricion.ics";
  enlace.click();
  URL.revokeObjectURL(url);
}
