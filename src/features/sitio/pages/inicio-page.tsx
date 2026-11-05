import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Check,
  Clock,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import imagenConsulta from "@/assets/sitio/consulta-nutriologa.jpg";
import imagenHero from "@/assets/sitio/hero-alimentos.jpg";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarPersona } from "@/features/nutricionistas/components/comunes";
import { resumenSemana } from "@/features/nutricionistas/lib/horario";
import { Revelar, type OrigenRevelar } from "@/features/sitio/components/revelar";
import { SitioPublico } from "@/features/sitio/components/sitio-publico";
import { VistaDeServicio, type VistaServicio } from "@/features/sitio/components/vistas-servicio";
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
  useIrASeccion(!opciones.isPending);

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

const BOTON_PRINCIPAL =
  "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-13 items-center justify-center rounded-full px-8 text-base font-semibold transition-colors";

/**
 * Los enlaces del menu navegan sin recargar, asi que el navegador ya no busca
 * la seccion por si solo. Espera a `listo`: el equipo y el contacto dependen de
 * datos, y bajar antes dejaria la pagina en otra altura.
 */
function useIrASeccion(listo: boolean) {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash || !listo) return;
    const suave = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    document.querySelector(hash)?.scrollIntoView({ behavior: suave ? "smooth" : "auto" });
  }, [hash, listo]);
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
    <section id={id} className={cn("mx-auto max-w-[84rem] scroll-mt-28 px-4 py-16 sm:py-24", className)}>
      <div className="mb-12 max-w-3xl space-y-4">
        <p className="text-primary text-sm font-semibold">{etiqueta}</p>
        <h2 className="font-editorial text-4xl leading-[1.08] font-normal tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">
          {titulo}
        </h2>
        {descripcion && <p className="text-muted-foreground text-lg text-pretty sm:text-xl">{descripcion}</p>}
      </div>
      {children}
    </section>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section className="mx-auto grid max-w-[84rem] items-center gap-10 px-4 pt-8 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6 lg:pt-10">
      <div className="anim-vista space-y-7">
        <h1 className="font-editorial text-[clamp(3.1rem,6.2vw,5rem)] leading-[1.02] font-normal tracking-[-0.025em] text-balance">
          {HERO.titulo} <em className="text-primary font-normal">{HERO.acento}</em>
        </h1>
        <p className="text-muted-foreground max-w-lg text-xl leading-relaxed text-pretty">{HERO.descripcion}</p>

        <ul className="space-y-3">
          {HERO.puntos.map((punto) => (
            <li key={punto} className="text-foreground flex items-center gap-3 text-base font-medium">
              <span className="bg-success-soft text-success-soft-foreground grid size-7 shrink-0 place-items-center rounded-full">
                <Check className="size-4" strokeWidth={3} aria-hidden />
              </span>
              {punto}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
          <Link to="/reservar" className={BOTON_PRINCIPAL}>
            Reservar cita
          </Link>
          <a
            href="#servicios"
            className="text-foreground decoration-primary/40 hover:decoration-primary text-base font-semibold underline decoration-2 underline-offset-4 transition-colors"
          >
            Ver servicios
          </a>
        </div>
      </div>

      <PlatoAnotado />
    </section>
  );
}

/*
 * Lamina del plato: que aporta cada ingrediente, con los colores de macros del
 * sistema. `x`/`y` son el punto del ingrediente en la lamina (0-100) y `hasta`
 * el extremo de la linea, junto a su texto.
 */
const ANOTACIONES = [
  { nombre: "Tomate", aporte: "Vitamina C", color: "var(--chart-2)", x: 36.7, y: 39.6, hasta: [15, 17], lugar: "top-[3%] left-0" },
  { nombre: "Hojas verdes", aporte: "Fibra", color: "var(--chart-3)", x: 58.6, y: 22.6, hasta: [85, 17], lugar: "top-[3%] right-0 text-right" },
  { nombre: "Aguacate", aporte: "Grasas saludables", color: "var(--chart-3)", x: 40.6, y: 69.8, hasta: [15, 83], lugar: "bottom-[3%] left-0" },
  { nombre: "Camote", aporte: "Carbohidratos", color: "var(--chart-2)", x: 75.6, y: 60.4, hasta: [85, 83], lugar: "right-0 bottom-[3%] text-right" },
];

/**
 * El plato recortado en circulo con sus ingredientes señalados. El recorte se
 * calcula sobre la foto: el plato mide 95 % de su alto y su centro cae en el
 * 53.7 % del ancho. En pantallas chicas quedan solo el plato y sus puntos.
 */
function PlatoAnotado() {
  return (
    <figure className="anim-entrada relative mx-auto aspect-square w-full max-w-[42rem]">
      <div className="absolute top-1/2 left-1/2 aspect-square w-[92%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full sm:w-[72%]">
        <img
          src={imagenHero}
          alt="Plato con verduras frescas, aguacate, garbanzos y camote"
          width={1400}
          height={933}
          fetchPriority="high"
          className="absolute top-[-1.6%] left-[-34.8%] h-[105.3%] w-[158%] max-w-none object-cover"
        />
      </div>

      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 hidden size-full sm:block">
        {ANOTACIONES.map((a) => (
          <g key={a.nombre}>
            <line
              x1={a.x}
              y1={a.y}
              x2={a.hasta[0]}
              y2={a.hasta[1]}
              stroke="var(--foreground)"
              strokeOpacity={0.55}
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={a.x} cy={a.y} r={1.1} fill={a.color} stroke="white" strokeWidth={0.45} />
          </g>
        ))}
      </svg>

      {ANOTACIONES.map((a) => (
        <figcaption key={a.nombre} className={cn("absolute hidden leading-tight sm:block", a.lugar)}>
          <span className="font-editorial block text-xl">{a.nombre}</span>
          <span className="text-muted-foreground block text-sm">{a.aporte}</span>
        </figcaption>
      ))}
    </figure>
  );
}

/* ---------- Servicios ---------- */

/* Zigzag de bloques: cada fila combina uno angosto y uno ancho, y cada uno entra
   por su esquina. */
const BLOQUES: { vista: VistaServicio; ancho: string; tinte: string; desde: OrigenRevelar }[] = [
  { vista: "medidas", ancho: "lg:col-span-5", tinte: "tinte-durazno", desde: "esquina-izquierda" },
  { vista: "plan", ancho: "lg:col-span-7", tinte: "tinte-marca", desde: "esquina-derecha" },
  { vista: "seguimiento", ancho: "lg:col-span-7", tinte: "tinte-menta", desde: "esquina-izquierda" },
  { vista: "clinica", ancho: "lg:col-span-5", tinte: "tinte-arena", desde: "esquina-derecha" },
];

function Servicios() {
  const resto = SERVICIOS.filter((s) => !s.vista);

  return (
    <Seccion
      id="servicios"
      etiqueta="Servicios"
      titulo="Todo lo que necesitas para cuidar tu alimentación"
      descripcion="Atención integral: desde la primera valoración hasta el seguimiento de cada objetivo."
    >
      <div className="grid gap-5 lg:grid-cols-12">
        {BLOQUES.map((b, i) => {
          const servicio = SERVICIOS.find((s) => s.vista === b.vista)!;
          return (
            <Revelar key={b.vista} desde={b.desde} retraso={(i % 2) * 120} className={b.ancho}>
              <article className={cn("flex h-full flex-col overflow-hidden rounded-[2rem]", b.tinte)}>
                <div className="p-7 pb-6 sm:p-9 sm:pb-6">
                  <h3 className="font-editorial text-3xl leading-tight font-normal sm:text-4xl">{servicio.titulo}</h3>
                  <p className="text-foreground/70 mt-2 max-w-xl text-lg leading-relaxed text-pretty">{servicio.descripcion}</p>
                </div>
                <VistaDeServicio vista={b.vista} />
              </article>
            </Revelar>
          );
        })}
      </div>

      {/* Siguen el mismo sistema de bloques, sin escena: el icono llena el espacio. */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {resto.map((s, i) => {
          const Icono = s.icono;
          return (
            <Revelar key={s.titulo} desde={i === 0 ? "esquina-izquierda" : "esquina-derecha"} retraso={i * 120}>
              <article
                className={cn(
                  "relative isolate flex h-full min-h-56 flex-col justify-center overflow-hidden rounded-[2rem] p-7 sm:p-9",
                  i === 0 ? "tinte-marca" : "tinte-durazno",
                )}
              >
                <Icono
                  aria-hidden
                  strokeWidth={1}
                  className="escena-pieza text-primary/20 absolute -right-8 -bottom-10 -z-10 size-52 -rotate-12"
                />
                <h3 className="font-editorial text-3xl leading-tight font-normal sm:text-4xl">{s.titulo}</h3>
                <p className="text-foreground/70 mt-2 max-w-sm text-lg leading-relaxed text-pretty">{s.descripcion}</p>
                {s.enlace && (
                  <Link
                    to={s.enlace.href}
                    className="text-foreground decoration-primary/40 hover:decoration-primary mt-3 w-fit text-base font-semibold underline decoration-2 underline-offset-4 transition-colors"
                  >
                    {s.enlace.texto}
                  </Link>
                )}
              </article>
            </Revelar>
          );
        })}
      </div>
    </Seccion>
  );
}

/* ---------- Como funciona ---------- */

function ComoFunciona() {
  return (
    <section
      id="como-funciona"
      className="mx-auto grid max-w-[84rem] scroll-mt-28 items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14"
    >
      <Revelar desde="esquina-izquierda">
      <img
        src={imagenConsulta}
        alt="Nutrióloga en su consultorio con un plan de alimentación y fruta sobre el escritorio"
        width={1000}
        height={1368}
        loading="lazy"
        className="foto-difuminada mx-auto aspect-[4/5] w-full max-w-lg object-cover object-[50%_30%] lg:-ml-8 lg:w-[calc(100%+2rem)] lg:max-w-none"
      />
      </Revelar>

      <Revelar desde="derecha">
        <div className="mb-10 space-y-4">
          <p className="text-primary text-sm font-semibold">Cómo funciona</p>
          <h2 className="font-editorial text-4xl leading-[1.08] font-normal tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">
            Empezar es sencillo
          </h2>
          <p className="text-muted-foreground text-lg text-pretty sm:text-xl">
            Atención personal de principio a fin: te escuchamos, te medimos y ajustamos el plan contigo.
          </p>
        </div>

        <ol>
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="border-border flex gap-5 border-t py-5">
              <span aria-hidden className="font-editorial text-primary w-9 shrink-0 text-3xl leading-none">
                {i + 1}
              </span>
              <div className="space-y-1.5">
                <h3 className="font-editorial text-2xl leading-none font-normal">{p.titulo}</h3>
                <p className="text-muted-foreground text-base leading-relaxed">{p.descripcion}</p>
              </div>
            </li>
          ))}
        </ol>

        <Link to="/reservar" className={cn(BOTON_PRINCIPAL, "mt-6")}>
          Agenda tu primera consulta
        </Link>
      </Revelar>
    </section>
  );
}

/* ---------- Equipo ---------- */

function Equipo({ opciones, cargando }: { opciones?: OpcionesReserva; cargando: boolean }) {
  const profesionales = opciones?.profesionales ?? [];
  if (!cargando && profesionales.length === 0) return null;

  return (
    <section id="equipo" className="scroll-mt-10 px-3 py-12 sm:px-5 sm:py-16">
      <Revelar>
        <div className="banda-equipo mx-auto grid max-w-[96rem] gap-10 overflow-hidden rounded-[2.5rem] px-6 py-14 text-white sm:px-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:items-center lg:gap-14 lg:px-16 lg:py-20">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-white/70">Equipo</p>
            <h2 className="font-editorial text-4xl leading-[1.08] font-normal tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">
              Profesionales que te acompañan
            </h2>
            <p className="text-lg text-pretty text-white/75 sm:text-xl">
              Elige con quién quieres atenderte y reserva directamente en su agenda.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {cargando
              ? Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-72 rounded-[1.75rem] bg-white/10" />)
              : profesionales.map((p, i) => (
                  <Revelar key={p.id} desde={i % 2 === 0 ? "esquina-izquierda" : "esquina-derecha"} retraso={250 + (i % 2) * 120}>
                    <article className="flex h-full flex-col rounded-[1.75rem] bg-white/[0.08] p-7 ring-1 ring-white/12 transition-colors hover:bg-white/[0.13]">
                      <AvatarPersona nombre={p.nombre} id={p.id} className="size-20 text-2xl" />
                      <h3 className="font-editorial mt-6 text-3xl leading-tight font-normal">{p.nombre}</h3>
                      <p className="mt-1 text-lg text-white/75">{p.especialidad ?? "Nutrición"}</p>
                      <p className="mt-4 mb-6 flex items-center gap-2 text-white/70">
                        <Clock className="size-4" aria-hidden /> Consultas de {p.duracionMinutos} minutos
                      </p>
                      <Link
                        to={`/reservar?profesional=${p.id}`}
                        className="mt-auto inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-base font-semibold text-[var(--brand-900)] transition-colors hover:bg-white/90"
                      >
                        Reservar con {p.nombre.replace(/^(Dra?\.|Lic\.|Mtra?\.)\s*/i, "").split(" ")[0]}
                      </Link>
                    </article>
                  </Revelar>
                ))}
          </div>
        </div>
      </Revelar>
    </section>
  );
}

/* ---------- Contacto ---------- */

function Contacto({ opciones }: { opciones?: OpcionesReserva }) {
  const horario = resumenSemana(opciones?.horarioClinica ?? []);
  const clinica = opciones?.clinica;

  return (
    <Seccion id="contacto" etiqueta="Contacto" titulo="Visítanos o escríbenos">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Revelar desde="izquierda">
        <div className="border-border/70 bg-card flex h-full flex-col gap-4 rounded-[1.75rem] border p-7">
          <h3 className="font-editorial flex items-center gap-2 text-2xl font-normal">
            <Clock className="text-primary size-5" aria-hidden /> Horario
          </h3>
          {horario.length > 0 ? (
            <ul className="space-y-2">
              {horario.map((fila) => {
                const [dias, ...horas] = fila.split(" ");
                return (
                  <li key={fila} className="border-border/60 flex items-baseline justify-between gap-4 border-b pb-2 last:border-0">
                    <span className="text-base font-medium">{dias}</span>
                    <span className="text-muted-foreground text-right text-base tabular-nums">{horas.join(" ")}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">Consulta los horarios disponibles al reservar.</p>
          )}
          <Link to="/reservar" className={cn(BOTON_PRINCIPAL, "mt-auto")}>
            Reservar cita
          </Link>
        </div>
        </Revelar>

        {clinica && (
          <Revelar desde="derecha">
            <DatosContacto clinica={clinica} />
          </Revelar>
        )}
      </div>
    </Seccion>
  );
}

/** Mapa a la izquierda y las formas de contacto a la derecha. */
function DatosContacto({ clinica }: { clinica: ClinicaPublica }) {
  const consulta = clinica.direccion ? encodeURIComponent(clinica.direccion) : null;
  const filas = [
    clinica.telefono && {
      icono: Phone,
      etiqueta: "Teléfono",
      valor: formatearTelefono(clinica.telefono),
      href: `tel:${clinica.telefono}`,
    },
    clinica.correo && {
      icono: Mail,
      etiqueta: "Correo",
      valor: clinica.correo,
      href: `mailto:${clinica.correo}`,
    },
  ].filter(Boolean) as { icono: typeof Phone; etiqueta: string; valor: string; href: string }[];

  return (
    <div className="border-border/70 bg-card grid h-full overflow-hidden rounded-[1.75rem] border sm:grid-cols-2">
      {consulta && (
        <iframe
          title={`Ubicación de ${clinica.nombre} en el mapa`}
          src={`https://www.google.com/maps?q=${consulta}&hl=es&z=16&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-64 w-full border-0 sm:h-full sm:min-h-72"
        />
      )}

      <div className="flex flex-col gap-5 p-6">
        <h3 className="font-editorial text-2xl font-normal">{clinica.nombre}</h3>
        <ul className="space-y-4">
          {filas.map((f) => {
            const Icono = f.icono;
            return (
              <li key={f.etiqueta}>
                <a href={f.href} className="group flex items-center gap-3">
                  <span className="bg-primary-soft text-primary-soft-foreground grid size-10 shrink-0 place-items-center rounded-full">
                    <Icono className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="text-muted-foreground block text-sm">{f.etiqueta}</span>
                    <span className="block text-base font-medium break-words group-hover:underline">{f.valor}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        {consulta && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${consulta}`}
            target="_blank"
            rel="noreferrer"
            className="border-border hover:bg-surface-subtle mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-full border text-base font-semibold transition-colors"
          >
            <MapPin className="size-4" aria-hidden /> Cómo llegar
          </a>
        )}
      </div>
    </div>
  );
}

/* ---------- Llamado final ---------- */

function Llamado() {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-8 pb-24 text-center">
      <Revelar>
      <h2 className="font-editorial text-5xl leading-[1.05] font-normal tracking-tight text-balance sm:text-6xl">
        ¿Listo para <em className="text-primary font-normal">empezar?</em>
      </h2>
      <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-xl text-pretty">
        Reserva tu primera consulta en línea; solo toma un par de minutos.
      </p>
      <Link to="/reservar" className={cn(BOTON_PRINCIPAL, "mt-8")}>
        Reservar cita
      </Link>
      </Revelar>
    </section>
  );
}
