import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import imagenLogin from "@/assets/sitio/login-verduras.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";

/**
 * Login centrado al estilo de las plataformas empresariales: barra superior
 * con la marca, una sola tarjeta de acceso en el centro y un pie discreto.
 * En pantallas anchas la rodean tarjetas de ejemplo del producto e iconos
 * flotantes (decorativos, con datos ficticios).
 *
 * El fondo se construye solo con tokens del tema (degradados y reticula),
 * asi que funciona igual en claro y en oscuro sin imagenes externas.
 */
function avisarSoporte() {
  toast.info("¿Problemas para acceder?", {
    description:
      "Solicita el restablecimiento de tu cuenta al administrador de la clínica.",
  });
}

function MarcaIcono({ className = "" }: { className?: string }) {
  return (
    <span
      className={`grid place-items-center rounded-xl bg-[linear-gradient(145deg,var(--brand-500),var(--brand-800))] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_16px_-6px_var(--brand-700)] ${className}`}
    >
      <Leaf className="size-1/2" strokeWidth={2.25} aria-hidden />
    </span>
  );
}

/* Textura de grano como SVG en linea (ruido fractal), sin pedir archivos. */
const GRANO = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`;

/* Curvas de nivel: anillos concentricos deformados con senos, como un mapa
   topografico. Se calculan una sola vez al cargar el modulo. */
const ANILLOS = Array.from({ length: 11 }, (_, k) => {
  const base = 40 + k * 30;
  const puntos = Array.from({ length: 72 }, (_, i) => {
    const t = (i / 72) * Math.PI * 2;
    const r =
      base * (1 + 0.1 * Math.sin(3 * t + k * 0.35) + 0.05 * Math.sin(5 * t - k * 0.2));
    return `${(400 + r * Math.cos(t)).toFixed(1)},${(400 + r * Math.sin(t)).toFixed(1)}`;
  });
  return `M${puntos.join(" L")} Z`;
});

function CurvasNivel({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 800 800"
      className={cn(
        "text-primary [mask-image:radial-gradient(closest-side,black_35%,transparent)]",
        className,
      )}
    >
      {ANILLOS.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.22}
          strokeWidth={1.25}
        />
      ))}
    </svg>
  );
}

/* Puntos de la curva de ejemplo de la tarjeta de seguimiento (peso en kg). */
const CURVA = [82.4, 81.9, 81.6, 80.8, 80.5, 79.7, 79.1, 78.6];

function rutaCurva(valores: number[], ancho: number, alto: number) {
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const paso = ancho / (valores.length - 1);
  return valores
    .map((v, i) => {
      const x = i * paso;
      const y = alto - ((v - min) / (max - min)) * (alto - 8) - 4;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const TARJETA_FLOTANTE =
  "bg-card/85 border-border rounded-2xl border p-4 shadow-[0_24px_50px_-24px_color-mix(in_oklch,var(--brand-900)_45%,transparent)] backdrop-blur-md";

function TarjetaSeguimiento() {
  const linea = rutaCurva(CURVA, 220, 60);
  return (
    <div className={`${TARJETA_FLOTANTE} w-[264px]`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-[var(--accent-100)] text-xs font-bold text-[var(--accent-800)]">
            MR
          </span>
          <div className="leading-tight">
            <p className="text-foreground text-[13px] font-semibold">María Rojas</p>
            <p className="text-muted-foreground text-[11px]">Seguimiento · Sem. 8</p>
          </div>
        </div>
        <span className="bg-success-soft text-success-soft-foreground rounded-full px-2 py-0.5 text-[11px] font-semibold">
          −3,8 kg
        </span>
      </div>

      <svg viewBox="0 0 220 60" className="mt-4 h-14 w-full overflow-visible">
        <defs>
          <linearGradient id="login-relleno-curva" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${linea} L220,60 L0,60 Z`} fill="url(#login-relleno-curva)" />
        <path
          d={linea}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="220" cy="56" r="4" fill="var(--card)" stroke="var(--primary)" strokeWidth="2.25" />
      </svg>

      <div className="border-border mt-3 grid grid-cols-3 gap-2 border-t pt-3">
        {[
          ["Peso", "78,6 kg"],
          ["IMC", "26,1"],
          ["Cintura", "88 cm"],
        ].map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
              {etiqueta}
            </p>
            <p className="text-foreground mt-0.5 text-[13px] font-semibold">{valor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const AVATARES_CITA = [
  ["JP", "bg-primary text-primary-foreground"],
  ["AL", "bg-[var(--accent-500)] text-white"],
  ["CS", "bg-[var(--sage-500)] text-white"],
] as const;

function TarjetaCita() {
  return (
    <div className={`${TARJETA_FLOTANTE} w-[236px]`}>
      <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--accent-600)] uppercase dark:text-[var(--accent-300)]">
        Próxima cita
      </p>
      <div className="mt-3 flex items-center gap-3">
        <span className="bg-primary-soft text-primary-soft-foreground grid size-11 shrink-0 place-items-center rounded-xl text-center leading-none">
          <span>
            <span className="block text-[9px] font-semibold uppercase opacity-75">Mar</span>
            <span className="mt-0.5 block text-base font-bold">14</span>
          </span>
        </span>
        <div className="leading-tight">
          <p className="text-foreground text-[13px] font-semibold">Control mensual</p>
          <p className="text-muted-foreground mt-0.5 text-[11px]">10:30 · Consultorio 2</p>
        </div>
      </div>
      <div className="border-border mt-3 flex items-center border-t pt-3">
        <span className="flex -space-x-1.5">
          {AVATARES_CITA.map(([iniciales, tono]) => (
            <span
              key={iniciales}
              className={`border-card grid size-6 place-items-center rounded-full border-2 text-[9px] font-bold ${tono}`}
            >
              {iniciales}
            </span>
          ))}
        </span>
        <span className="text-muted-foreground ml-2 text-[11px]">+5 citas hoy</span>
      </div>
    </div>
  );
}

/* Columna izquierda (lg+): foto grande a sangre, con las tarjetas de ejemplo
   flotando encima. En movil se oculta y queda solo el formulario. */
function PanelImagen() {
  return (
    <aside className="relative hidden lg:sticky lg:top-0 lg:block lg:h-dvh">
      <div className="relative isolate h-full">
        {/* La foto se desvanece hacia la derecha y deja ver el mismo fondo
            del formulario: no hay corte entre las dos columnas. */}
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_right,black_55%,transparent_100%)]">
          <img src={imagenLogin} alt="" className="absolute inset-0 size-full object-cover" />
          {/* Copia con desenfoque suave solo en el ultimo tramo, antes de desvanecerse. */}
          <img
            src={imagenLogin}
            alt=""
            className="absolute inset-0 size-full scale-105 object-cover blur-md [mask-image:linear-gradient(to_right,transparent_55%,black_90%)]"
          />
          {/* Velos: oscurece arriba y abajo para el texto y tiñe con la marca. */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.35),rgb(0_0_0/0.05)_35%,rgb(0_0_0/0.72))]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--brand-900)_55%,transparent),transparent_55%)]" />
        </div>

        {/* El contenido se queda en la parte nitida de la foto. */}
        <div className="flex h-full w-[72%] flex-col justify-between p-10 text-white xl:p-12">
          <span className="flex items-center gap-2.5">
            <MarcaIcono className="size-9" />
            <span className="text-lg font-bold tracking-tight">NutriClinica</span>
          </span>

          <div aria-hidden className="pointer-events-none relative hidden h-72 min-[1200px]:block">
            <div className="login-flotar absolute top-0 left-2 -rotate-[3deg]">
              <TarjetaSeguimiento />
            </div>
            <div className="login-flotar-lento absolute right-6 bottom-0 rotate-[3deg]">
              <TarjetaCita />
            </div>
          </div>

          <div className="max-w-md space-y-3">
            <p className="text-3xl leading-tight font-bold tracking-tight text-balance xl:text-4xl">
              Cada consulta, un paso más cerca de su objetivo.
            </p>
            <p className="text-[15px] text-white/80">
              Expedientes, medidas, planes de alimentación y agenda de tu clínica en un solo lugar.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  /* Las credenciales solo se precargan en desarrollo: en produccion el
     formulario arranca limpio. */
  const [correoElectronico, setCorreoElectronico] = useState(
    import.meta.env.DEV ? "admin@nutriclinica.cl" : "",
  );
  const [contrasena, setContrasena] = useState(
    import.meta.env.DEV ? "NutriClinica2026" : "",
  );
  const [verContrasena, setVerContrasena] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const desde = location.state?.from?.pathname || "/panel";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      await login(correoElectronico.trim(), contrasena);
      navigate(desde, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("No se pudo iniciar sesión. Intenta nuevamente.");
      }
    } finally {
      setCargando(false);
    }
  };

  const detectarMayusculas = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setMayusculas(e.getModifierState("CapsLock"));
  };

  return (
    <div className="bg-background relative isolate min-h-dvh overflow-clip lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {/* ---------- Fondo ---------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Malla de color: manchas grandes de teal, salvia y terracota que
            se mezclan entre si en lugar de un fondo liso. */}
        <div className="absolute -top-[30%] -left-[15%] h-[85%] w-[65%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--brand-300)_55%,transparent),transparent)] dark:bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--brand-700)_45%,transparent),transparent)]" />
        <div className="absolute -top-[25%] -right-[10%] h-[70%] w-[50%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--accent-200)_60%,transparent),transparent)] dark:bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--accent-800)_35%,transparent),transparent)]" />
        <div className="absolute -bottom-[35%] -left-[5%] h-[75%] w-[55%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--sage-300)_60%,transparent),transparent)] dark:bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--sage-700)_45%,transparent),transparent)]" />
        <div className="absolute -right-[15%] -bottom-[30%] h-[80%] w-[60%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--brand-200)_55%,transparent),transparent)] dark:bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--brand-800)_40%,transparent),transparent)]" />

        {/* Curvas de nivel en dos esquinas: textura organica y de marca */}
        <CurvasNivel className="absolute -top-40 -left-40 size-[720px]" />
        <CurvasNivel className="absolute -right-48 -bottom-56 size-[820px] rotate-[140deg]" />

        {/* Puntos finos, solo hacia el centro */}
        <div className="absolute inset-0 bg-[radial-gradient(color-mix(in_oklch,var(--primary)_22%,transparent)_1px,transparent_1.5px)] [mask-image:radial-gradient(ellipse_55%_50%_at_50%_45%,black,transparent)] bg-[size:22px_22px]" />

        {/* Grano: rompe el degradado plano y le da acabado de papel */}
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-multiply dark:opacity-[0.07] dark:mix-blend-screen"
          style={{ backgroundImage: GRANO }}
        />
      </div>

      <PanelImagen />

    <div className="relative flex min-h-dvh flex-col">
      {/* ---------- Barra superior ---------- */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
        {/* En lg la marca ya esta en la foto; se deja el hueco para no mover el boton. */}
        <span className="flex items-center gap-2.5 lg:invisible">
          <MarcaIcono className="size-8" />
          <span className="text-foreground text-[17px] font-bold tracking-tight">
            NutriClinica
          </span>
        </span>
        <button
          type="button"
          onClick={avisarSoporte}
          className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          ¿Necesitas ayuda?
        </button>
      </header>

      {/* ---------- Acceso ---------- */}
      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:py-14">
        <div className="login-entrada relative w-full max-w-[440px]">

          <div className="text-center">
            <MarcaIcono className="mx-auto size-14 rounded-2xl" />
            <h1 className="text-foreground mt-6 text-[1.75rem] leading-tight font-bold tracking-[-0.03em] sm:text-[2rem]">
              Inicia sesión en tu clínica
            </h1>
            <p className="text-muted-foreground mt-2.5 text-[15px]">
              Expedientes, medidas y agenda en un solo lugar.
            </p>
          </div>

          {/* Borde degradado: la tarjeta va dentro de un marco de 1px. El
              halo de detras le da profundidad sobre el fondo. */}
          <div className="relative isolate mt-9">
          <div aria-hidden className="absolute -inset-x-16 -inset-y-10 -z-10 bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_20%,transparent),transparent)]" />
          <div className="rounded-[22px] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_35%,var(--border)),var(--border)_45%)] p-px shadow-[0_30px_70px_-30px_color-mix(in_oklch,var(--brand-900)_45%,transparent),0_8px_20px_-12px_color-mix(in_oklch,var(--brand-900)_25%,transparent)]">
            <div className="bg-card relative overflow-hidden rounded-[21px] p-7 sm:p-9">
              {/* Brillo superior: degradado de marca que se funde con la tarjeta */}
              <div aria-hidden className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_9%,transparent),transparent)]" />
              <div aria-hidden className="absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklch,var(--primary)_70%,transparent),transparent)]" />
              <form onSubmit={handleSubmit} className="relative space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="correo" className="text-[13px] font-semibold">
                    Correo electrónico
                  </Label>
                  <div className="relative">
                    <Mail
                      aria-hidden
                      className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                    />
                    <Input
                      id="correo"
                      type="email"
                      autoComplete="email"
                      autoFocus={!import.meta.env.DEV}
                      placeholder="nombre@nutriclinica.cl"
                      value={correoElectronico}
                      onChange={(e) => setCorreoElectronico(e.target.value)}
                      aria-invalid={error ? true : undefined}
                      className="h-12 pl-10 text-[15px]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="contrasena" className="text-[13px] font-semibold">
                      Contraseña
                    </Label>
                    <button
                      type="button"
                      onClick={avisarSoporte}
                      className="text-primary text-[13px] font-semibold underline-offset-4 hover:underline"
                    >
                      ¿La olvidaste?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock
                      aria-hidden
                      className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                    />
                    <Input
                      id="contrasena"
                      type={verContrasena ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      onKeyUp={detectarMayusculas}
                      onKeyDown={detectarMayusculas}
                      onBlur={() => setMayusculas(false)}
                      aria-invalid={error ? true : undefined}
                      className="h-12 pr-11 pl-10 text-[15px]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setVerContrasena((v) => !v)}
                      aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={verContrasena}
                      className="text-muted-foreground hover:text-foreground hover:bg-accent absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-md transition-colors"
                    >
                      {verContrasena ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  {mayusculas && (
                    <p className="text-warning-soft-foreground flex items-center gap-1.5 text-xs font-medium">
                      <AlertCircle className="size-3.5" aria-hidden />
                      Bloq Mayús está activado
                    </p>
                  )}
                </div>

                {error && (
                  <div
                    role="alert"
                    className="bg-destructive-soft text-destructive-soft-foreground flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="group mt-2 h-12 w-full text-[15px]"
                  disabled={cargando}
                >
                  {cargando ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      Iniciar sesión
                      <ArrowRight
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </>
                  )}
                </Button>

                {import.meta.env.DEV && (
                  <p className="bg-accent-soft text-accent-soft-foreground rounded-lg px-3 py-2 text-center text-xs">
                    Entorno de desarrollo: admin@nutriclinica.cl
                  </p>
                )}
              </form>
            </div>
          </div>
          </div>

          <p className="text-muted-foreground mt-7 flex items-center justify-center gap-1.5 text-xs">
            <ShieldCheck className="text-primary size-3.5" aria-hidden />
            Acceso exclusivo para personal autorizado de la clínica
          </p>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            ¿Eres paciente?{" "}
            <Link to="/reservar" className="text-primary font-semibold underline-offset-4 hover:underline">
              Reserva tu cita en línea
            </Link>
          </p>
        </div>
      </main>

      {/* ---------- Pie ---------- */}
      <footer className="text-muted-foreground-subtle mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-1 px-6 py-5 text-xs sm:flex-row sm:px-8">
        <span>© {new Date().getFullYear()} NutriClinica</span>
        <span>Sistema de consulta clínica y nutricional</span>
      </footer>
    </div>
    </div>
  );
}
