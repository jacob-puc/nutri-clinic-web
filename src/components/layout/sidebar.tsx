import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { LogoNutriClinica } from "@/components/layout/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/sidebar-context";
import { TooltipSimple } from "@/components/ui/tooltip-simple";
import { UsuarioSidebar } from "@/components/auth/usuario-sidebar";
import type { InsigniasNav, ModulosOcultos } from "@/components/layout/nav-items";

export function MarcaSidebar({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoNutriClinica className="size-9 shrink-0 rounded-[10px] shadow-[inset_0_1px_0_0_oklch(1_0_0/0.3),0_4px_14px_-4px_var(--sidebar-glow)]" />
      {!collapsed && (
        <span className="flex flex-col leading-none">
          <span className="text-sidebar-foreground text-base font-bold tracking-tight">
            Nutri
            <span className="text-sidebar-primary">Clinica</span>
          </span>
          <span className="text-sidebar-muted-foreground mt-1 text-[11px] font-medium">
            Consulta nutricional
          </span>
        </span>
      )}
    </span>
  );
}

export function Sidebar({ insignias, ocultos }: { insignias?: InsigniasNav; ocultos?: ModulosOcultos }) {
  const { collapsed, toggle } = useSidebar();
  const etiquetaToggle = collapsed ? "Expandir menú" : "Contraer menú";

  const botonToggle = (
    <button
      type="button"
      onClick={toggle}
      aria-label={etiquetaToggle}
      className={cn(
        "text-sidebar-muted-foreground grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg outline-none",
        "transition-colors duration-200 hover:bg-sidebar-hover hover:text-sidebar-foreground active:bg-sidebar-pressed",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
      )}
    >
      {collapsed ? <PanelLeftOpen aria-hidden className="size-4" /> : <PanelLeftClose aria-hidden className="size-4" />}
    </button>
  );

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "sidebar-surface text-sidebar-foreground hidden shrink-0 md:flex md:flex-col",
        "transition-[width] duration-200 ease-(--ease-out-soft)",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Marca y boton de plegar en la misma fila: el boton ya no ocupa una
          franja propia al pie. Plegado, el boton baja junto al avatar. */}
      <div className={cn("flex h-16 shrink-0 items-center", collapsed ? "justify-center px-2" : "gap-2 pr-2.5 pl-4")}>
        <span className="min-w-0 flex-1">
          <MarcaSidebar collapsed={collapsed} />
        </span>
        {!collapsed && (
          <TooltipSimple side="right" contenido={etiquetaToggle}>
            {botonToggle}
          </TooltipSimple>
        )}
      </div>

      {/* Separador con degradado: marca el corte sin una linea dura de lado
          a lado. */}
      <div
        aria-hidden
        className="via-sidebar-border mx-3 h-px shrink-0 bg-gradient-to-r from-transparent to-transparent"
      />

      <div className={cn("scrollbar-slim flex flex-1 flex-col overflow-y-auto py-5", collapsed ? "px-2" : "px-3")}>
        <SidebarNav collapsed={collapsed} insignias={insignias} ocultos={ocultos} />
      </div>

      <div className={cn("border-sidebar-border flex flex-col gap-1 border-t p-2.5", collapsed && "items-center px-2")}>
        {collapsed && (
          <TooltipSimple side="right" contenido={etiquetaToggle}>
            {botonToggle}
          </TooltipSimple>
        )}
        <UsuarioSidebar collapsed={collapsed} />
      </div>
    </aside>
  );
}
