import { Outlet } from "react-router-dom";

import { Sidebar } from "@/components/layout/sidebar";
import { SidebarMobile } from "@/components/layout/sidebar-mobile";
import { Topbar } from "@/components/layout/topbar";
import { usePermisos } from "@/features/auth/hooks/use-permisos";
import { AvisoConsultaEnCurso } from "@/features/consultas/components/aviso-consulta-en-curso";
import { useInsigniasNav } from "@/features/navegacion/hooks/use-insignias-nav";

export function AppLayout() {
  /* Los contadores se calculan aqui (capa con acceso a features) y bajan por
     props al menu, que sigue sin conocer los modulos de datos. */
  const insignias = useInsigniasNav();
  const permisos = usePermisos();
  const ocultos = new Set<string>();
  if (!permisos.verClinico) {
    ocultos.add("/consultas");
    ocultos.add("/planes");
  }
  if (!permisos.gestionarEquipo) ocultos.add("/nutricionistas");

  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      <Sidebar insignias={insignias} ocultos={ocultos} />
      <SidebarMobile insignias={insignias} ocultos={ocultos} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        {/* `scrollbar-gutter: stable` reserva el ancho de la barra aunque
            todavia no exista, para que al aparecer el contenido no se
            desplace y la pagina no se vea "chueca". */}
        <main className="scrollbar-slim min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
          {permisos.verClinico && <AvisoConsultaEnCurso />}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
