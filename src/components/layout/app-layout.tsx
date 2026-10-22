import { Outlet } from "react-router-dom";

import { Sidebar } from "@/components/layout/sidebar";
import { SidebarMobile } from "@/components/layout/sidebar-mobile";
import { Topbar } from "@/components/layout/topbar";

export function AppLayout() {
  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      <Sidebar />
      <SidebarMobile />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        {/* `scrollbar-gutter: stable` reserva el ancho de la barra aunque
            todavia no exista, para que al aparecer el contenido no se
            desplace y la pagina no se vea "chueca". */}
        <main className="scrollbar-slim min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
