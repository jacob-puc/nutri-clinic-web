import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { BienvenidaSistema, useBienvenida } from "@/components/layout/bienvenida-sistema";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarMobile } from "@/components/layout/sidebar-mobile";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { usePermisos } from "@/features/auth/hooks/use-permisos";
import { AvisoConsultaEnCurso } from "@/features/consultas/components/aviso-consulta-en-curso";
import { useInsigniasNav } from "@/features/navegacion/hooks/use-insignias-nav";
import { recordarVista } from "@/lib/ruta-volver";
import { cn } from "@/lib/utils";

export function AppLayout() {
  /* Los contadores se calculan aqui (capa con acceso a features) y bajan por
     props al menu, que sigue sin conocer los modulos de datos. */
  const insignias = useInsigniasNav();
  const permisos = usePermisos();
  const { usuario } = useAuth();
  const entrando = useBienvenida();
  /* Cada seccion recuerda su ultima vista para que "volver" regrese ahi. */
  const ubicacion = useLocation();
  useEffect(() => recordarVista(ubicacion.pathname, ubicacion.search), [ubicacion.pathname, ubicacion.search]);
  const primerNombre = usuario?.nombreCompleto.replace(/^(Dra?\.|Lic\.|Mtra?\.)\s*/i, "").split(" ")[0] ?? null;
  const ocultos = new Set<string>();
  if (!permisos.verClinico) {
    ocultos.add("/consultas");
    ocultos.add("/planes");
  }
  if (!permisos.gestionarEquipo) ocultos.add("/nutricionistas");
  if (!permisos.verReportes) ocultos.add("/reportes");
  if (!permisos.configurarClinica) ocultos.add("/configuracion");

  return (
    <div className={cn("bg-background flex h-dvh overflow-hidden", entrando && "entrada-sistema")}>
      {entrando && <BienvenidaSistema nombre={primerNombre} />}
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
