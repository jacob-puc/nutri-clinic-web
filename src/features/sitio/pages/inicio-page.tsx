import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  Clock,
  Mail,
  MapPin,
  Navigation,
  LineChart,
  Phone,
  Salad,
  Sparkles,
} from "lucide-react";

import imagenConsulta from "@/assets/sitio/consulta-nutriologa.jpg";
import imagenHero from "@/assets/sitio/hero-alimentos.jpg";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarPersona } from "@/features/nutricionistas/components/comunes";
import { resumenSemana } from "@/features/nutricionistas/lib/horario";
import { SitioPublico } from "@/features/sitio/components/sitio-publico";
import { formatearTelefono, useOpcionesPublicas } from "@/features/sitio/hooks/use-opciones-publicas";
import { HERO, PASOS, SERVICIOS } from "@/features/sitio/contenido";
import { cn } from "@/lib/utils";
import type { ClinicaPublica, OpcionesReserva } from "@/types/api";

/**
 * Pagina de inicio publica: presenta la clinica y lleva a reservar. El equipo,
 * el horario, el contacto y el proximo espacio libre son datos reales.
 */
export function InicioPage() {
  const opciones = useOpcionesPublicas();

  return (
    <SitioPublico>
      <Hero />
      <Servicios />
      <ComoFunciona />
      <Equipo opciones={opciones.data} cargando={opciones.isPending} />
      <Contacto opciones={opciones.data} />
      <Llamado />
    </SitioPublico>
  );
}

function Seccion({
  id,
  etiqueta,
  titulo,
  descripcion,
  children,
  className,
}: {
  id: string;
  etiqueta: string;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-6xl scroll-mt-28 px-4 py-16 sm:py-20", className)}>
      <div className="mb-10 max-w-2xl space-y-3">
        <p className="text-primary text-xs font-semibold tracking-widest uppercase">{etiqueta}</p>
        <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{titulo}</h2>
        {descripcion && <p className="text-muted-foreground text-base text-pretty">{descripcion}</p>}
      </div>
      {children}
    </section>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-12 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-20">
      <div className="space-y-7">
        <span className="border-primary/20 bg-primary-soft/60 text-primary-soft-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
          <Sparkles className="size-3.5" aria-hidden /> {HERO.etiqueta}
        </span>
        <h1 className="text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {HERO.titulo.split(" ").slice(0, -2).join(" ")}{" "}
          <span className="text-gradient-brand">{HERO.titulo.split(" ").slice(-2).join(" ")}</span>
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg text-pretty">{HERO.descripcion}</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/reservar"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold shadow-md transition-colors"
          >
            <CalendarCheck2 className="size-5" aria-hidden /> Reservar cita
          </Link>
          <a
            href="#servicios"
            className="border-border bg-card hover:bg-surface-subtle inline-flex h-12 items-center justify-center gap-2 rounded-full border px-6 text-[15px] font-semibold transition-colors"
          >
            Conoce los servicios <ArrowRight className="size-4" aria-hidden />
          </a>
        </div>

        <ul className="text-muted-foreground flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-5">
          {HERO.puntos.map((p) => (
            <li key={p} className="flex items-center gap-1.5">
              <span className="bg-success-soft text-success-soft-foreground grid size-5 place-items-center rounded-full">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <ImagenHero />
    </section>
  );
}

/** Foto grande con dos etiquetas flotantes que resumen lo que ofrece la clinica. */
function ImagenHero() {
  return (
    <div className="relative isolate mx-auto w-full max-w-lg lg:max-w-none">
      <div aria-hidden className="gradient-brand absolute -inset-6 -z-10 rounded-[3rem] opacity-20 blur-3xl" />
      <div className="border-border/60 shadow-overlay overflow-hidden rounded-[2rem] border">
        <img
          src={imagenHero}
          alt="Plato con verduras frescas, aguacate, garbanzos y camote"
          width={1400}
          height={933}
          fetchPriority="high"
          className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
        />
      </div>

      <div className="bg-card/90 border-border/60 shadow-raised absolute bottom-5 -left-3 flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md sm:-left-6">
        <span className="bg-primary-soft text-primary-soft-foreground grid size-10 place-items-center rounded-xl">
          <Salad className="size-5" aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Plan a tu medida</p>
          <p className="text-muted-foreground text-xs">Menú semanal personalizado</p>
        </div>
      </div>

      <div className="bg-card/90 border-border/60 shadow-raised absolute top-6 -right-3 flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md sm:-right-6">
        <span className="bg-success-soft text-success-soft-foreground grid size-10 place-items-center rounded-xl">
          <LineChart className="size-5" aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Seguimiento real</p>
          <p className="text-muted-foreground text-xs">Tu avance consulta a consulta</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Servicios ---------- */

function Servicios() {
  return (
    <Seccion
      id="servicios"
      etiqueta="Servicios"
      titulo="Todo lo que necesitas para cuidar tu alimentación"
      descripcion="Atención integral: desde la primera valoración hasta el seguimiento de cada objetivo."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICIOS.map((s) => {
          const Icono = s.icono;
          return (
            <article
              key={s.titulo}
              className="border-border/70 bg-card hover:border-primary/40 group rounded-2xl border p-6 transition-colors"
            >
              <span className="bg-primary-soft text-primary-soft-foreground group-hover:bg-primary group-hover:text-primary-foreground mb-4 grid size-11 place-items-center rounded-xl transition-colors">
                <Icono className="size-5" aria-hidden />
              </span>
              <h3 className="mb-1.5 font-semibold">{s.titulo}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.descripcion}</p>
            </article>
          );
        })}
      </div>
    </Seccion>
  );
}

/* ---------- Como funciona ---------- */

function ComoFunciona() {
  return (
    <div className="bg-surface-subtle/60 border-border/60 border-y">
      <section id="como-funciona" className="mx-auto grid max-w-6xl scroll-mt-28 items-center gap-12 px-4 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16">
        <div className="relative isolate mx-auto w-full max-w-md lg:max-w-none">
          <div aria-hidden className="gradient-brand absolute -inset-5 -z-10 rounded-[3rem] opacity-15 blur-3xl" />
          <img
            src={imagenConsulta}
            alt="Nutrióloga en su consultorio con un plan de alimentación y fruta sobre el escritorio"
            width={1000}
            height={1368}
            loading="lazy"
            className="border-border/60 shadow-overlay aspect-[4/5] w-full rounded-[2rem] border object-cover object-[50%_30%]"
          />
        </div>

        <div>
          <div className="mb-10 space-y-3">
            <p className="text-primary text-xs font-semibold tracking-widest uppercase">Cómo funciona</p>
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Empezar es sencillo</h2>
            <p className="text-muted-foreground text-base text-pretty">
              Atención personal de principio a fin: te escuchamos, te medimos y ajustamos el plan contigo.
            </p>
          </div>

          <ol className="space-y-8">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="relative flex gap-5">
                {i < PASOS.length - 1 && (
                  <span aria-hidden className="bg-border absolute top-12 bottom-[-2rem] left-[1.375rem] w-px" />
                )}
                <span className="gradient-brand relative grid size-11 shrink-0 place-items-center rounded-full text-base font-bold text-white shadow-md">
                  {i + 1}
                </span>
                <div className="space-y-1.5 pt-1.5">
                  <h3 className="text-lg font-semibold">{p.titulo}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{p.descripcion}</p>
                </div>
              </li>
            ))}
          </ol>

          <Link
            to="/reservar"
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-10 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold shadow-sm transition-colors"
          >
            <CalendarCheck2 className="size-4" aria-hidden /> Agenda tu primera consulta
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ---------- Equipo ---------- */

function Equipo({ opciones, cargando }: { opciones?: OpcionesReserva; cargando: boolean }) {
  const profesionales = opciones?.profesionales ?? [];
  if (!cargando && profesionales.length === 0) return null;

  return (
    <Seccion
      id="equipo"
      etiqueta="Equipo"
      titulo="Profesionales que te acompañan"
      descripcion="Elige con quién quieres atenderte y reserva directamente en su agenda."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cargando
          ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
          : profesionales.map((p) => (
              <article key={p.id} className="border-border/70 bg-card flex flex-col gap-4 rounded-2xl border p-6">
                <div className="flex items-center gap-3">
                  <AvatarPersona nombre={p.nombre} id={p.id} className="size-14 text-base" />
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{p.nombre}</h3>
                    <p className="text-muted-foreground truncate text-sm">{p.especialidad ?? "Nutrición"}</p>
                  </div>
                </div>
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <Clock className="size-4" aria-hidden /> Consultas de {p.duracionMinutos} minutos
                </p>
                <Link
                  to={`/reservar?profesional=${p.id}`}
                  className="border-border hover:border-primary hover:bg-primary-soft/40 mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-full border text-sm font-semibold transition-colors"
                >
                  Reservar con {p.nombre.replace(/^(Dra?\.|Lic\.|Mtra?\.)\s*/i, "").split(" ")[0]}
                </Link>
              </article>
            ))}
      </div>
    </Seccion>
  );
}

/* ---------- Contacto ---------- */

function Contacto({ opciones }: { opciones?: OpcionesReserva }) {
  const horario = resumenSemana(opciones?.horarioClinica ?? []);
  const clinica = opciones?.clinica;

  return (
    <Seccion id="contacto" etiqueta="Contacto" titulo="Visítanos o escríbenos">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border-border/70 bg-card space-y-4 rounded-2xl border p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <Clock className="text-primary size-5" aria-hidden /> Horario de atención
          </h3>
          {horario.length > 0 ? (
            <ul className="space-y-2">
              {horario.map((fila) => {
                const [dias, ...horas] = fila.split(" ");
                return (
                  <li key={fila} className="border-border/60 flex items-baseline justify-between gap-4 border-b pb-2 last:border-0">
                    <span className="font-medium">{dias}</span>
                    <span className="text-muted-foreground text-right text-sm tabular-nums">{horas.join(" ")}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">Consulta los horarios disponibles al reservar.</p>
          )}
        </div>

        {clinica && <DatosContacto clinica={clinica} />}
      </div>
    </Seccion>
  );
}

function DatosContacto({ clinica }: { clinica: ClinicaPublica }) {
  const filas = [
    clinica.direccion && {
      icono: MapPin,
      etiqueta: "Dirección",
      valor: clinica.direccion,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinica.direccion)}`,
      accion: "Cómo llegar",
    },
    clinica.telefono && {
      icono: Phone,
      etiqueta: "Teléfono",
      valor: formatearTelefono(clinica.telefono),
      href: `tel:${clinica.telefono}`,
      accion: "Llamar",
    },
    clinica.correo && {
      icono: Mail,
      etiqueta: "Correo",
      valor: clinica.correo,
      href: `mailto:${clinica.correo}`,
      accion: "Escribir",
    },
  ].filter(Boolean) as { icono: typeof MapPin; etiqueta: string; valor: string; href: string; accion: string }[];

  return (
    <div className="border-border/70 bg-card space-y-4 rounded-2xl border p-6">
      <h3 className="flex items-center gap-2 font-semibold">
        <Navigation className="text-primary size-5" aria-hidden /> {clinica.nombre}
      </h3>
      <ul className="space-y-3">
        {filas.map((f) => {
          const Icono = f.icono;
          return (
            <li key={f.etiqueta} className="flex items-start gap-3">
              <span className="bg-primary-soft text-primary-soft-foreground grid size-9 shrink-0 place-items-center rounded-full">
                <Icono className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">{f.etiqueta}</p>
                <p className="text-sm font-medium break-words">{f.valor}</p>
              </div>
              <a
                href={f.href}
                target={f.href.startsWith("http") ? "_blank" : undefined}
                rel={f.href.startsWith("http") ? "noreferrer" : undefined}
                className="text-primary shrink-0 self-center text-sm font-semibold hover:underline"
              >
                {f.accion}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Llamado final ---------- */

function Llamado() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="gradient-brand relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white sm:px-12 sm:py-16">
        <div aria-hidden className="absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="absolute -bottom-28 -left-20 size-72 rounded-full bg-white/10 blur-2xl" />
        <h2 className="relative text-3xl font-bold tracking-tight text-balance sm:text-4xl">¿Listo para empezar?</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-white/85">
          Reserva tu primera consulta en línea; solo toma un par de minutos.
        </p>
        <Link
          to="/reservar"
          className="text-foreground relative mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold shadow-lg transition-transform hover:scale-[1.02]"
        >
          <CalendarCheck2 className="size-5" aria-hidden /> Reservar cita
        </Link>
      </div>
    </section>
  );
}
