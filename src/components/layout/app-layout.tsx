import { Outlet } from "react-router-dom";

import { Sidebar } from "@/components/layout/sidebar";
import { SidebarMobile } from "@/components/layout/sidebar-mobile";
import { Topbar } from "@/components/layout/topbar";

/**
 * Cascarón de la aplicación: lateral fija en escritorio, drawer en movil,
 * barra superior y el outlet donde se monta la ruta activa.
 *
 * El contenido va en `<main>` con `min-w-0` para que las tablas anchas
 * hagan scroll horizontal en su contenedor y no empujen la barra lateral.
 */
export function AppLayout() {
  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      <Sidebar />
      <SidebarMobile />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
