import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, MapPin, Menu, Phone, X } from "lucide-react";

import { LogoNutriClinica } from "@/components/layout/logo";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { formatearTelefono, useOpcionesPublicas } from "@/features/sitio/hooks/use-opciones-publicas";
import { cn } from "@/lib/utils";

/*
 * Cascaron de las paginas publicas (inicio y reservacion): fondo salvia propio
 * del sitio, navbar sobre la pagina y pie. Todo sale de un solo endpoint
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
    <div className="fondo-sitio text-foreground relative isolate flex min-h-dvh flex-col overflow-x-clip">
      <NavbarPublico />
      <div className="flex-1">{children}</div>
      <PiePublico />
    </div>
  );
}

const CLASE_ENLACE = "text-foreground/75 hover:text-foreground text-[15px] font-medium transition-colors";

function NavbarPublico() {
  const [abierto, setAbierto] = useState(false);
  const { autenticado } = useAuth();
  const opciones = useOpcionesPublicas();
  const telefono = opciones.data?.clinica.telefono;

  return (
    <header className="relative z-30 px-4 pt-5">
      <nav
        aria-label="Principal"
        className="relative mx-auto flex max-w-[84rem] items-center justify-between gap-6"
      >
        <Link
          to="/"
          onClick={() => setAbierto(false)}
          className="focus-visible:ring-ring flex min-w-0 items-center gap-2.5 rounded-full outline-none focus-visible:ring-2"
        >
          <LogoNutriClinica className="size-11 shrink-0 rounded-full" />
          <span className="font-editorial truncate text-2xl leading-none tracking-tight">NutriClínica</span>
        </Link>

        <ul className="ml-auto hidden items-center gap-7 lg:flex">
          {ENLACES.map((e) => (
            <li key={e.href}>
              <a href={e.href} className={CLASE_ENLACE}>
                {e.etiqueta}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center justify-end gap-4">
          {telefono && (
            <a href={`tel:${telefono}`} aria-label={`Llamar a la clínica: ${telefono}`} className={cn(CLASE_ENLACE, "hidden items-center gap-2 xl:flex")}>
              <Phone className="size-4" aria-hidden />
              {formatearTelefono(telefono)}
            </a>
          )}
          <NavLink
            to="/reservar"
            onClick={() => setAbierto(false)}
            className={({ isActive }) =>
              cn(
                "bg-primary text-primary-foreground hover:bg-primary/90 flex h-11 items-center rounded-full px-5 text-[15px] font-semibold transition-colors",
                isActive && "ring-primary/30 ring-4",
              )
            }
          >
            Reservar<span className="hidden sm:inline">&nbsp;cita</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            className="hover:bg-foreground/5 grid size-10 place-items-center rounded-full lg:hidden"
          >
            {abierto ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {abierto && (
          <div className="border-border/70 bg-card shadow-overlay absolute inset-x-0 top-[calc(100%+0.5rem)] rounded-2xl border p-2 lg:hidden">
            <ul className="grid">
              {ENLACES.map((e) => (
                <li key={e.href}>
                  <a
                    href={e.href}
                    onClick={() => setAbierto(false)}
                    className="hover:bg-surface-subtle block rounded-xl px-4 py-3 text-base font-medium"
                  >
                    {e.etiqueta}
                  </a>
                </li>
              ))}
              {telefono && (
                <li>
                  <a href={`tel:${telefono}`} className="hover:bg-surface-subtle flex items-center gap-2 rounded-xl px-4 py-3 text-base font-medium">
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
        <div className="mx-auto mt-3 flex max-w-[84rem] justify-end">
          <Link
            to="/panel"
            className="text-foreground/70 hover:text-foreground flex items-center gap-1.5 text-sm font-medium"
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
      <div className="mx-auto flex max-w-[84rem] flex-col gap-3 px-4 py-8 text-xs sm:flex-row sm:items-center sm:justify-between">
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
