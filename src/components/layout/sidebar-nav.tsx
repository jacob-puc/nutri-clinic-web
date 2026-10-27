import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import type { ModuloNav } from "@/components/layout/nav-items";
import { MODULOS_NAV } from "@/components/layout/nav-items";
import { TooltipSimple } from "@/components/ui/tooltip-simple";

interface SidebarNavProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

const MODULOS_ACTIVOS = MODULOS_NAV.filter((modulo) => modulo.activo);
const MODULOS_PROXIMOS = MODULOS_NAV.filter((modulo) => !modulo.activo);

/* Base comun de los items: misma altura y radio para activos y proximos,
   asi la rejilla del menu no salta entre un grupo y otro. */
const BASE_ITEM = cn(
  "group/item relative flex h-10 items-center gap-3 rounded-lg px-1.5 text-sm font-medium outline-none",
  "transition-[background-color,color,box-shadow] duration-200 ease-(--ease-out-soft)",
  "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
);

/* El estado activo se pinta con `aria-current="page"`, que NavLink ya pone
   solo. No se usa la forma de funcion de `className`: dentro del Tooltip el
   Slot de Radix concatena className como texto y la funcion se perderia. */
const ITEM_ENLACE = cn(
  BASE_ITEM,
  "text-sidebar-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground active:bg-sidebar-pressed",
  "aria-[current=page]:sidebar-item-active aria-[current=page]:text-sidebar-accent-foreground aria-[current=page]:font-semibold",
);

function TejaIcono({ modulo }: { modulo: ModuloNav }) {
  const Icon = modulo.icon;

  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md transition-[background-color,color,box-shadow] duration-200",
        "group-hover/item:bg-sidebar-hover group-hover/item:text-sidebar-foreground",
        "group-aria-[current=page]/item:sidebar-icon-active",
      )}
    >
      <Icon className="size-[18px]" />
    </span>
  );
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
  const enlace = (
    <NavLink
      to={modulo.href}
      onClick={onNavigate}
      aria-label={collapsed ? modulo.label : undefined}
      className={cn(ITEM_ENLACE, collapsed && "justify-center")}
    >
      {/* Marca de seccion activa pegada al borde del panel: refuerza el
          estado sin depender solo del color. */}
      <span
        aria-hidden
        className={cn(
          "bg-sidebar-primary absolute top-1/2 h-2 w-[3px] -translate-y-1/2 rounded-r-full opacity-0",
          "shadow-[0_0_10px_1px_var(--sidebar-glow)] transition-[opacity,height] duration-200",
          "group-aria-[current=page]/item:h-5 group-aria-[current=page]/item:opacity-100",
          collapsed ? "-left-2" : "-left-3",
        )}
      />
      <TejaIcono modulo={modulo} />
      {!collapsed && <span className="flex-1 truncate">{modulo.label}</span>}
    </NavLink>
  );

  if (!collapsed) return enlace;

  return (
    <TooltipSimple side="right" contenido={modulo.label}>
      {enlace}
    </TooltipSimple>
  );
}

function SidebarProximo({
  modulo,
  collapsed,
}: {
  modulo: ModuloNav;
  collapsed: boolean;
}) {
  return (
    <TooltipSimple
      side="right"
      contenido={
        <>
          <p className="font-medium">{modulo.label}</p>
          <p className="text-xs opacity-75">{modulo.descripcion}</p>
        </>
      }
    >
      <div
        aria-disabled="true"
        tabIndex={0}
        className={cn(
          BASE_ITEM,
          "text-sidebar-muted-foreground cursor-not-allowed opacity-55",
          collapsed && "justify-center",
        )}
      >
        <TejaIcono modulo={modulo} />
        {!collapsed && <span className="flex-1 truncate">{modulo.label}</span>}
      </div>
    </TooltipSimple>
  );
}

function EtiquetaGrupo({ children }: { children: string }) {
  return (
    <p className="text-sidebar-muted-foreground px-2 pb-1.5 text-xs font-medium">
      {children}
    </p>
  );
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Navegación principal" className="flex flex-1 flex-col">
      <div className="flex flex-col gap-1">
        {!collapsed && <EtiquetaGrupo>Módulos</EtiquetaGrupo>}
        {MODULOS_ACTIVOS.map((modulo) => (
          <SidebarLink
            key={modulo.href}
            modulo={modulo}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {/* Los modulos sin construir van en su propio grupo en vez de llevar
          cada uno una pastilla "Pronto": el agrupamiento ya lo dice. */}
      <div
        className={cn(
          "mt-6 flex flex-col gap-1",
          collapsed && "border-sidebar-border mt-4 border-t pt-4",
        )}
      >
        {!collapsed && <EtiquetaGrupo>Próximamente</EtiquetaGrupo>}
        {MODULOS_PROXIMOS.map((modulo) => (
          <SidebarProximo key={modulo.href} modulo={modulo} collapsed={collapsed} />
        ))}
      </div>
    </nav>
  );
}
