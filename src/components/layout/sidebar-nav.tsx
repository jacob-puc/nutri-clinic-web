import { LogoNutriClinica } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import type { ModuloNav } from "@/components/layout/nav-items";
import { MODULOS_NAV } from "@/components/layout/nav-items";
import { NavLink } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarNavProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

function SidebarLink({
  modulo,
  collapsed,
  onNavigate,
}: {
  modulo: ModuloNav;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = modulo.icon;

  const classes = cn(
    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
    "transition-colors duration-150 outline-none",
    "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
    modulo.activo
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-sidebar-foreground",
  );

  if (!modulo.activo) {
    const contenido = (
      <>
        <Icon aria-hidden className="size-5 shrink-0 opacity-70" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{modulo.label}</span>
            <span className="rounded-full border border-sidebar-border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-sidebar-muted-foreground">
              Pronto
            </span>
          </>
        )}
      </>
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            aria-disabled="true"
            className={cn(classes, "cursor-not-allowed opacity-60")}
          >
            {contenido}
          </div>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right">
            <p className="font-medium">{modulo.label}</p>
            <p className="text-muted-foreground text-xs">{modulo.descripcion}</p>
          </TooltipContent>
        )}
      </Tooltip>
    );
  }

  return (
    <NavLink
      to={modulo.href}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          classes,
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Marca de seccion activa: refuerza el estado sin depender solo del color. */}
          <span
            aria-hidden
            className={cn(
              "absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary transition-opacity",
              isActive ? "opacity-100" : "opacity-0",
            )}
          />
          <Icon aria-hidden className="size-5 shrink-0" />
          {!collapsed && <span className="flex-1 truncate">{modulo.label}</span>}
        </>
      )}
    </NavLink>
  );
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Navegacion principal" className="flex flex-1 flex-col gap-1">
      {!collapsed && (
        <p className="px-3 pb-1 text-xs font-semibold tracking-wider text-sidebar-muted-foreground uppercase">
          Modulos
        </p>
      )}
      {MODULOS_NAV.map((modulo) => (
        <SidebarLink
          key={modulo.href}
          modulo={modulo}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="border-sidebar-border space-y-3 border-t pt-4">
      <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
        <LogoNutriClinica className="size-9 shrink-0 rounded-lg" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sidebar-foreground truncate text-sm font-semibold">
              NutriClinica
            </p>
            <p className="text-sidebar-muted-foreground truncate text-xs">
              Sistema de consulta clinica
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
