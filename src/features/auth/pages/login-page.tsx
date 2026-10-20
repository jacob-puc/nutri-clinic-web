import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  Leaf,
  Loader2,
  Lock,
  Mail,
  Stethoscope,
} from "lucide-react";

/* Tipografia de prueba para el login. El CSS se registra aqui y solo se
   aplica a esta pantalla (clase `font-brand`). */
import "@fontsource-variable/dm-sans";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api-error";

/**
 * Login a pantalla completa: la marca y el mensaje viven sobre el fondo de
 * toda la pagina, no dentro de la tarjeta. El formulario ocupa un panel
 * lateral solido para que el texto del formulario no compita con la imagen.
 *
 * El fondo es un SVG local (public/fondo-login.svg) para no depender de la
 * red ni de licencias de terceros. Si se quiere sustituir por una fotografia,
 * basta con reemplazar la URL de la capa de imagen de abajo.
 */
const FRASES = [
  { icono: ClipboardList, texto: "Expediente clínico con medidas y objetivos" },
  { icono: CalendarDays, texto: "Agenda de citas de la clínica en un vistazo" },
  { icono: Stethoscope, texto: "Ficha por paciente, lista para la consulta" },
] as const;

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
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const desde = location.state?.from?.pathname || "/pacientes";

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

  return (
    <div className="font-brand relative min-h-dvh w-full overflow-hidden bg-background">
      {/* ---------- Fondo de toda la pagina ---------- */}
      <div aria-hidden className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/fondo-login.svg)" }}
        />
        {/* Tinte de la paleta sobre la imagen: garantiza >=8:1 para el
            texto blanco en cualquier zona clara de la ilustracion. */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,17,18,0.95)_0%,rgba(0,46,41,0.86)_46%,rgba(0,14,17,0.97)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_12%_30%,rgba(0,12,14,0.55)_0%,rgba(0,12,14,0.18)_55%,transparent_100%)]" />
      </div>

      <div className="relative z-10 grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(430px,36vw)]">
        {/* ---------- Marca a escala de pagina ---------- */}
        <section className="flex min-h-[58vh] flex-col justify-between gap-10 px-6 py-8 text-white sm:px-10 sm:py-12 lg:min-h-dvh lg:px-16 lg:py-14">
          <header className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl border border-white/25 bg-white/10 backdrop-blur-sm">
                <Leaf className="size-5" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-base font-semibold tracking-tight">
                  NutriClinica
                </span>
                <span className="text-white/75 mt-1 text-[11px] font-medium tracking-wide">
                  Consulta nutricional
                </span>
              </span>
            </span>

            <ThemeToggle className="text-white/80 hover:bg-white/10 hover:text-white" />
          </header>

          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-[#f0995b] uppercase">
              Sistema de consulta clínica y nutricional
            </p>

            <h1 className="mt-5 text-5xl leading-[0.92] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              NutriClinica
              <span className="text-[#f0995b]">.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">
              El expediente, las medidas y la agenda de la clínica en un solo
              lugar.
            </p>

            <ul className="mt-8 grid max-w-xl gap-3">
              {FRASES.map(({ icono: Icono, texto }) => (
                <li
                  key={texto}
                  className="flex items-center gap-3 text-sm text-white/85"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10">
                    <Icono className="size-3.5" strokeWidth={2} aria-hidden />
                  </span>
                  {texto}
                </li>
              ))}
            </ul>
          </div>

          <figure className="max-w-lg border-l-2 border-[#f0995b]/70 pl-4">
            <blockquote className="text-[15px] leading-relaxed text-white/80 italic">
              “La consulta se decide con datos: peso, medidas, objetivos y
              seguimiento por paciente.”
            </blockquote>
            <figcaption className="text-white/70 mt-2 text-[11px] tracking-[0.18em] uppercase">
              Expediente · medidas · seguimiento
            </figcaption>
          </figure>
        </section>

        {/* ---------- Panel de acceso ---------- */}
        <section className="bg-card flex items-center justify-center border-border px-5 py-10 sm:px-8 lg:border-l lg:py-14">
          <div className="w-full max-w-sm">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
              Acceso al sistema
            </p>
            <h2 className="text-foreground mt-2 text-2xl font-semibold tracking-tight">
              Iniciar sesión
            </h2>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Ingresa tus credenciales para acceder al sistema.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="correo" className="text-sm font-medium">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail
                    aria-hidden
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  />
                  <Input
                    id="correo"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@nutriclinica.cl"
                    value={correoElectronico}
                    onChange={(e) => setCorreoElectronico(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contrasena" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock
                    aria-hidden
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  />
                  <Input
                    id="contrasena"
                    type="password"
                    autoComplete="current-password"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="bg-destructive-soft text-destructive-soft-foreground rounded-lg px-3 py-2.5 text-sm"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={cargando}
              >
                {cargando && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>

              {import.meta.env.DEV && (
                <p className="bg-accent-soft text-accent-soft-foreground rounded-lg px-3 py-2 text-xs">
                  Entorno de desarrollo: admin@nutriclinica.cl
                </p>
              )}
            </form>

            <p className="text-muted-foreground-subtle mt-8 text-xs">
              NutriClinica · consulta clínica y nutricional
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
