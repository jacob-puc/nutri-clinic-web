import { Navigate, createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/components/layout/app-layout";
import { PacienteDetallePage } from "@/features/pacientes/pages/paciente-detalle-page";
import { PacientesPage } from "@/features/pacientes/pages/pacientes-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/pacientes" replace /> },
      { path: "pacientes", element: <PacientesPage /> },
      { path: "pacientes/:id", element: <PacienteDetallePage /> },
      { path: "agenda", element: <Navigate to="/pacientes" replace /> },
      { path: "consultas", element: <Navigate to="/pacientes" replace /> },
      { path: "nutricionistas", element: <Navigate to="/pacientes" replace /> },
      { path: "planes", element: <Navigate to="/pacientes" replace /> },
      { path: "*", element: <Navigate to="/pacientes" replace /> },
    ],
  },
]);
