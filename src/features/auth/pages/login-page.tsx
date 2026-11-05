import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import imagenLogin from "@/assets/sitio/login-verduras.jpg";
import { marcarBienvenida } from "@/components/layout/bienvenida-sistema";
import { LogoNutriClinica } from "@/components/layout/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api-error";

/**
 * Login del personal: la foto a la izquierda se funde con el fondo y el
 * formulario va directo sobre el, sin tarjeta. Comparte fondo, tipografia y
 * botones con la pagina publica para que entrar no se sienta como otro producto.
 */
function avisarSoporte() {
  toast.info("¿Problemas para acceder?", {
    description:
      "Solicita el restablecimiento de tu cuenta al administrador de la clínica.",
  });
}

/* En escritorio la foto ocupa el alto completo y se pierde hacia la derecha; en
   movil es una franja que se pierde hacia abajo. */
function PanelFoto() {
  return (
    <aside className="relative h-56 sm:h-72 lg:sticky lg:top-0 lg:h-dvh">
      <div className="anim-vista absolute inset-0 [mask-image:linear-gradient(to_bottom,black_55%,transparent)] lg:[mask-image:linear-gradient(to_right,black_70%,transparent)]">
        <img src={imagenLogin} alt="" className="size-full object-cover" />
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-[linear-gradient(to_top,color-mix(in_oklch,var(--brand-950)_82%,transparent),transparent_58%)] lg:block"
        />
      </div>

      <div className="anim-entrada absolute bottom-14 left-12 hidden max-w-xl text-white lg:block xl:left-16">
        <h2 className="font-editorial text-6xl leading-[1.04] font-normal tracking-[-0.02em] text-balance xl:text-7xl">
          Todo tu consultorio, <em className="font-normal">en orden.</em>
        </h2>
        <p className="mt-4 text-xl text-pretty text-white/85">Expedientes, planes y agenda en un solo lugar.</p>
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
      marcarBienvenida();
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
    <div className="fondo-sitio relative isolate min-h-dvh overflow-clip lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <PanelFoto />

      <div className="relative flex flex-col px-6 pb-8 sm:px-10 lg:min-h-dvh lg:px-12 lg:pt-5">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="focus-visible:ring-ring flex min-w-0 items-center gap-2.5 rounded-full outline-none focus-visible:ring-2">
            <LogoNutriClinica className="size-11 shrink-0 rounded-full" />
            <span className="font-editorial truncate text-2xl leading-none tracking-tight">NutriClínica</span>
          </Link>
          <Link to="/" className="text-foreground/75 hover:text-foreground shrink-0 text-[15px] font-medium transition-colors">
            Volver al sitio
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="anim-entrada w-full max-w-md">
            <h1 className="font-editorial text-5xl leading-[1.05] font-normal tracking-tight sm:text-6xl">
              Hola <em className="text-primary font-normal">de nuevo</em>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg">Entra para ver tu agenda del día.</p>

            <form onSubmit={handleSubmit} className="mt-9 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="correo" className="text-[15px] font-medium">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail
                    aria-hidden
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
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
                    className="h-13 rounded-full pl-11 text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="contrasena" className="text-[15px] font-medium">
                    Contraseña
                  </Label>
                  <button
                    type="button"
                    onClick={avisarSoporte}
                    className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
                  >
                    ¿La olvidaste?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    aria-hidden
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
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
                    className="h-13 rounded-full pr-12 pl-11 text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setVerContrasena((v) => !v)}
                    aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={verContrasena}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full transition-colors"
                  >
                    {verContrasena ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  </button>
                </div>
                {mayusculas && (
                  <p className="text-warning-soft-foreground flex items-center gap-1.5 text-sm font-medium">
                    <AlertCircle className="size-4" aria-hidden />
                    Bloq Mayús está activado
                  </p>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="bg-destructive-soft text-destructive-soft-foreground flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 inline-flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-8 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              >
                {cargando && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>

              {import.meta.env.DEV && (
                <p className="text-muted-foreground text-center text-sm">Entorno de desarrollo: admin@nutriclinica.cl</p>
              )}
            </form>

            <p className="text-muted-foreground mt-8 text-center text-base">
              ¿Eres paciente?{" "}
              <Link
                to="/reservar"
                className="text-foreground decoration-primary/40 hover:decoration-primary font-semibold underline decoration-2 underline-offset-4 transition-colors"
              >
                Reserva tu cita
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
