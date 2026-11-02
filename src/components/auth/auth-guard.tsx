import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { usePermisos } from "@/features/auth/hooks/use-permisos";
import type { Permisos } from "@/features/auth/lib/permisos";
import { CambiarContrasenaPage } from "@/features/auth/pages/cambiar-contrasena-page";

export function AuthGuard() {
  const { autenticado, cargando, usuario } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /* Con contraseña temporal no se monta la app: el backend rechazaria todo
     lo demas hasta que la cambie. */
  if (usuario?.debeCambiarContrasena) {
    return <CambiarContrasenaPage />;
  }

  return <Outlet />;
}

/**
 * Rutas que el rol no puede usar: en vez de una pantalla rota por 403, se
 * manda al inicio. El backend aplica la misma regla.
 */
export function RequierePermiso({ permiso }: { permiso: keyof Permisos }) {
  const permisos = usePermisos();
  if (!permisos[permiso]) return <Navigate to="/citas" replace />;
  return <Outlet />;
}
