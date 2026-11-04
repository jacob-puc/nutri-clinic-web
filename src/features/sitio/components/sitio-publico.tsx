import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { CalendarCheck2, LayoutDashboard, MapPin, Menu, Phone, X } from "lucide-react";

import { LogoNutriClinica } from "@/components/layout/logo";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { formatearTelefono, useOpcionesPublicas } from "@/features/sitio/hooks/use-opciones-publicas";
import { cn } from "@/lib/utils";

/*
 * Cascaron de las paginas publicas (inicio y reservacion): navbar flotante en
 * forma de pildora, halo de marca y pie. Todo sale de un solo endpoint
 * publico, compartido por ambas paginas con la misma clave de cache.
 */

const ENLACES = [
  { etiqueta: "Servicios", href: "/#servicios" },
  { etiqueta: "Cómo funciona", href: "/#como-funciona" },
  { etiqueta: "Equipo", href: "/#equipo" },
  { etiqueta: "Contacto", href: "/#contacto" },
];

export function SitioPublico({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground relative isolate flex min-h-dvh flex-col overflow-x-clip">
      {/* Halo de marca detras del encabezado: es la cara publica de la clinica. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--brand-500)_18%,transparent),transparent)]"
      />
      <NavbarPublico />
      <div className="flex-1">{children}</div>
      <PiePublico />
    </div>
  );
}

function NavbarPublico() {
  const [abierto, setAbierto] = useState(false);
  const { autenticado } = useAuth();
  const opciones = useOpcionesPublicas();
  const telefono = opciones.data?.clinica.telefono;

  return (
    <header className="sticky top-3 z-30 px-4 pt-3">
      <nav
        aria-label="Principal"
        className="border-border/70 bg-card/75 shadow-raised supports-[backdrop-filter]:bg-card/60 relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full border p-2 backdrop-blur-md"
      >
        <Link
          to="/"
          onClick={() => setAbierto(false)}
          className="focus-visible:ring-ring flex min-w-0 items-center gap-2.5 rounded-full pr-2 outline-none focus-visible:ring-2"
        >
          <LogoNutriClinica className="size-10 shrink-0 rounded-full" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-bold tracking-tight">
              Nutri<span className="text-gradient-brand">Clinica</span>
            </span>
            <span className="text-muted-foreground truncate text-[11px] font-medium">Consulta nutricional</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {ENLACES.map((e) => (
            <li key={e.href}>
              <a
                href={e.href}
                className="text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
              >
                {e.etiqueta}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-1.5">
          {telefono && (
            <a
              href={`tel:${telefono}`}
              aria-label={`Llamar a la clínica: ${telefono}`}
              className="text-muted-foreground hover:text-foreground hover:bg-surface-subtle hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors md:flex"
            >
              <Phone className="size-4" aria-hidden />
              <span className="hidden xl:inline">{formatearTelefono(telefono)}</span>
            </a>
          )}
          <NavLink
            to="/reservar"
            onClick={() => setAbierto(false)}
            className={({ isActive }) =>
              cn(
                "bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-sm transition-colors",
                isActive && "ring-primary/30 ring-4",
              )
            }
          >
            <CalendarCheck2 className="size-4" aria-hidden />
            <span>
              Reservar<span className="hidden sm:inline"> cita</span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            className="hover:bg-surface-subtle grid size-10 place-items-center rounded-full lg:hidden"
          >
            {abierto ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Menu movil: tarjeta flotante bajo la pildora. */}
        {abierto && (
          <div className="border-border/70 bg-card shadow-overlay absolute inset-x-0 top-[calc(100%+0.5rem)] rounded-2xl border p-2 lg:hidden">
            <ul className="grid">
              {ENLACES.map((e) => (
                <li key={e.href}>
                  <a
                    href={e.href}
                    onClick={() => setAbierto(false)}
                    className="hover:bg-surface-subtle block rounded-xl px-4 py-3 text-sm font-medium"
                  >
                    {e.etiqueta}
                  </a>
                </li>
              ))}
              {telefono && (
                <li>
                  <a href={`tel:${telefono}`} className="hover:bg-surface-subtle flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium">
                    <Phone className="size-4" aria-hidden /> Llamar · {formatearTelefono(telefono)}
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}
      </nav>

      {/* Quien ya tiene sesion del equipo vuelve al sistema en un clic. */}
      {autenticado && (
        <div className="mx-auto mt-2 flex max-w-6xl justify-end">
          <Link
            to="/panel"
            className="bg-card/80 border-border/70 text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur"
          >
            <LayoutDashboard className="size-3.5" aria-hidden /> Ir al panel
          </Link>
        </div>
      )}
    </header>
  );
}

function PiePublico() {
  const opciones = useOpcionesPublicas();
  const clinica = opciones.data?.clinica;

  return (
    <footer className="border-border/60 text-muted-foreground border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>
            © {new Date().getFullYear()} {clinica?.nombre ?? "NutriClínica"}
          </p>
          {clinica?.direccion && (
            <p className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden /> {clinica.direccion}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link to="/reservar" className="hover:text-foreground font-medium">
            Reservar cita
          </Link>
          <Link to="/login" className="hover:text-foreground">
            Acceso del personal
          </Link>
        </div>
      </div>
    </footer>
  );
}
