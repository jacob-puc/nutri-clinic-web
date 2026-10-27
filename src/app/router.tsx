import { Navigate, createBrowserRouter } from "react-router-dom";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppLayout } from "@/components/layout/app-layout";
import { LoginPage } from "@/features/auth/pages/login-page";
import { PacienteDetallePage } from "@/features/pacientes/pages/paciente-detalle-page";
import { PacientesPage } from "@/features/pacientes/pages/pacientes-page";
import { AgendaPage } from "@/features/citas/pages/agenda-page";
import { CitaDetallePage } from "@/features/citas/pages/cita-detalle-page";
import { ConsultasPage } from "@/features/consultas/pages/consultas-page";
import { ConsultaDetallePage } from "@/features/consultas/pages/consulta-detalle-page";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/pacientes" replace /> },
          { path: "pacientes", element: <PacientesPage /> },
          { path: "pacientes/:id", element: <PacienteDetallePage /> },
          { path: "citas", element: <AgendaPage /> },
          { path: "citas/:id", element: <CitaDetallePage /> },
          { path: "consultas", element: <ConsultasPage /> },
          { path: "consultas/:id", element: <ConsultaDetallePage /> },
          /* La sección pasó de llamarse Agenda a Citas: las rutas viejas
             redirigen para no dejar enlaces muertos. */
          { path: "agenda", element: <Navigate to="/citas" replace /> },
          { path: "agenda/:id", element: <Navigate to="/citas" replace /> },
          { path: "nutricionistas", element: <Navigate to="/pacientes" replace /> },
          { path: "planes", element: <Navigate to="/pacientes" replace /> },
          { path: "*", element: <Navigate to="/pacientes" replace /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
