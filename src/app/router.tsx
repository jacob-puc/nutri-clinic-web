import { Navigate, createBrowserRouter } from "react-router-dom";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppLayout } from "@/components/layout/app-layout";
import { LoginPage } from "@/features/auth/pages/login-page";
import { PacienteDetallePage } from "@/features/pacientes/pages/paciente-detalle-page";
import { PacientesPage } from "@/features/pacientes/pages/pacientes-page";
import { AgendaPage } from "@/features/citas/pages/agenda-page";
import { CitaDetallePage } from "@/features/citas/pages/cita-detalle-page";

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
          { path: "agenda", element: <AgendaPage /> },
          { path: "agenda/:id", element: <CitaDetallePage /> },
          { path: "consultas", element: <Navigate to="/pacientes" replace /> },
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
