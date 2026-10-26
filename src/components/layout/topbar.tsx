import { Menu, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { MenuUsuario } from "@/components/auth/menu-usuario";
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
        aria-label="Abrir menú"
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
              /* replace: mismo criterio que la lista de pacientes. Sin él,
                 cada Enter empuja una entrada al historial y Atrás deja de
                 funcionar como el usuario espera. */
              navigate(
                termino
                  ? `/pacientes?busqueda=${encodeURIComponent(termino)}`
                  : "/pacientes",
                { replace: true },
              );
            }
          }}
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <MenuUsuario />
      </div>
    </header>
  );
}
