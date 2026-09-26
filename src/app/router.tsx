import { Navigate, createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/components/layout/app-layout";
import { PacienteDetallePage } from "@/features/pacientes/pages/paciente-detalle-page";
import { PacientesPage } from "@/features/pacientes/pages/pacientes-page";

/**
 * Rutas de la aplicacion.
 *
 * Pacientes es el unico modulo con backend completo, asi que es el unico con
 * vista de listado y vista de detalle. Los modulos futuros (Agenda,
 * Consultas) ya salen en la lateral deshabilitados y sus rutas redirigen a
 * Pacientes: si alguien llega por URL o por un enlace guardado, aterriza en
 * algo util en vez de ver una pantalla en blanco.
 */
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
