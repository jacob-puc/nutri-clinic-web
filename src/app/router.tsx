import { Navigate, createBrowserRouter } from "react-router-dom";

import { AuthGuard, RequierePermiso } from "@/components/auth/auth-guard";
import { AppLayout } from "@/components/layout/app-layout";
import { LoginPage } from "@/features/auth/pages/login-page";
import { ReservarPage } from "@/features/reservas/pages/reservar-page";
import { InicioPage } from "@/features/sitio/pages/inicio-page";
import { PacienteDetallePage } from "@/features/pacientes/pages/paciente-detalle-page";
import { PacientesPage } from "@/features/pacientes/pages/pacientes-page";
import { AgendaPage } from "@/features/citas/pages/agenda-page";
import { CitaDetallePage } from "@/features/citas/pages/cita-detalle-page";
import { ConsultasPage } from "@/features/consultas/pages/consultas-page";
import { ConsultaDetallePage } from "@/features/consultas/pages/consulta-detalle-page";
import { PlanesPage } from "@/features/menus/pages/planes-page";
import { CobrosPage } from "@/features/cobros/pages/cobros-page";
import { ReportesPage } from "@/features/reportes/pages/reportes-page";
import { ConfiguracionPage } from "@/features/configuracion/pages/configuracion-page";
import { ResumenPage } from "@/features/resumen/pages/resumen-page";
import { NutricionistasPage } from "@/features/nutricionistas/pages/nutricionistas-page";
import { NutricionistaDetallePage } from "@/features/nutricionistas/pages/nutricionista-detalle-page";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  /* Publicas: la pagina de la clinica y la reservacion, sin cuenta. */
  {
    path: "/",
    element: <InicioPage />,
  },
  {
    path: "/reservar",
    element: <ReservarPage />,
  },
  /* El sistema del equipo: el inicio es /panel y el resto conserva sus rutas. */
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "panel", element: <ResumenPage /> },
          { path: "pacientes", element: <PacientesPage /> },
          { path: "pacientes/:id", element: <PacienteDetallePage /> },
          { path: "citas", element: <AgendaPage /> },
          { path: "citas/:id", element: <CitaDetallePage /> },
          { path: "cobros", element: <CobrosPage /> },
          /* Lo clinico (consultas, planes) no es para recepcion; el equipo,
             solo para el administrador. El backend aplica las mismas reglas. */
          {
            element: <RequierePermiso permiso="verClinico" />,
            children: [
              { path: "consultas", element: <ConsultasPage /> },
              { path: "consultas/:id", element: <ConsultaDetallePage /> },
              { path: "planes", element: <PlanesPage /> },
            ],
          },
          {
            element: <RequierePermiso permiso="gestionarEquipo" />,
            children: [
              { path: "nutricionistas", element: <NutricionistasPage /> },
              { path: "nutricionistas/:id", element: <NutricionistaDetallePage /> },
            ],
          },
          {
            element: <RequierePermiso permiso="verReportes" />,
            children: [{ path: "reportes", element: <ReportesPage /> }],
          },
          {
            element: <RequierePermiso permiso="configurarClinica" />,
            children: [{ path: "configuracion", element: <ConfiguracionPage /> }],
          },
          /* La sección pasó de llamarse Agenda a Citas: las rutas viejas
             redirigen para no dejar enlaces muertos. */
          { path: "agenda", element: <Navigate to="/citas" replace /> },
          { path: "agenda/:id", element: <Navigate to="/citas" replace /> },
          { path: "*", element: <Navigate to="/panel" replace /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
