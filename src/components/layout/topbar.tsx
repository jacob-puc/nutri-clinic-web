import { Menu, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { LogoConTexto } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useSidebar } from "@/components/layout/sidebar-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { setMobileOpen } = useSidebar();
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        "bg-background/85 supports-[backdrop-filter]:bg-background/65 sticky top-0 z-30",
        "flex h-16 shrink-0 items-center gap-3 border-b border-border px-4 backdrop-blur-md",
        "md:px-6",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </Button>

      <Link
        to="/pacientes"
        className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
      >
        <LogoConTexto />
      </Link>

      {/* Buscador global: en esta iteracion navega al listado de pacientes,
          que es el unico modulo activo. Se habilita el atajo "/" para no
          obligar a soltar el teclado. */}
      <div className="relative ml-auto w-full max-w-sm md:ml-0">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          placeholder="Buscar paciente..."
          aria-label="Buscar paciente"
          className="bg-card h-9 pl-9"
          onKeyDown={(evento) => {
            if (evento.key === "Enter") {
              const termino = evento.currentTarget.value.trim();
              navigate(
                termino
                  ? `/pacientes?busqueda=${encodeURIComponent(termino)}`
                  : "/pacientes",
              );
            }
          }}
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <div
          className="bg-card ml-1 hidden size-9 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground sm:flex"
          aria-label="Sesion de usuario"
          title="Autenticacion pendiente"
        >
          NC
        </div>
      </div>
    </header>
  );
}
