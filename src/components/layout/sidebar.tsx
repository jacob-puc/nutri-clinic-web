import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoNutriClinica } from "@/components/layout/logo";
import { SidebarFooter, SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/sidebar-context";

/**
 * Barra lateral fija en escritorio. Se pliega a solo iconos para liberar
 * espacio cuando la tabla de pacientes necesita el ancho.
 */
export function Sidebar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "bg-sidebar border-sidebar-border text-sidebar-foreground hidden shrink-0 border-r md:flex md:flex-col",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "gap-2.5 px-4",
        )}
      >
        <LogoNutriClinica className="size-9 shrink-0 rounded-lg" />
        {!collapsed && (
          <span className="flex flex-col leading-none">
            <span className="text-sidebar-foreground text-base font-bold tracking-tight">
              Nutri
              <span className="text-sidebar-primary">Clinica</span>
            </span>
            <span className="text-sidebar-muted-foreground mt-0.5 text-[11px] font-medium">
              Consulta nutricional
            </span>
          </span>
        )}
      </div>

      <div className={cn("flex-1 overflow-y-auto py-4", collapsed ? "px-2" : "px-3")}>
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className={cn("border-t border-sidebar-border p-3", collapsed && "px-2")}>
        <SidebarFooter collapsed={collapsed} />
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className={cn(
            "text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-sidebar-foreground mt-2 w-full",
            collapsed && "px-0",
          )}
          aria-label={collapsed ? "Expandir menu" : "Contraer menu"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <>
              <PanelLeftClose className="size-4" />
              <span>Contraer menu</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
