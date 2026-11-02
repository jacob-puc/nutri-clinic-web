import { useAuth } from "@/features/auth/hooks/use-auth";
import { permisosDe, type Permisos } from "@/features/auth/lib/permisos";
import type { RolUsuario } from "@/types/api";

export function usePermisos(): Permisos & { rol: RolUsuario | undefined } {
  const { usuario } = useAuth();
  return { ...permisosDe(usuario?.rol), rol: usuario?.rol };
}
