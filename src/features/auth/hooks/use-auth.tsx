import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { authApi } from "@/features/auth/api/auth-api";
import { tokenStorage } from "@/features/auth/lib/tokens";
import type { CambiarContrasenaDto, UsuarioAutenticado } from "@/features/auth/types/auth";
import { ApiError } from "@/lib/api-error";

interface AuthContextValue {
  usuario: UsuarioAutenticado | null;
  cargando: boolean;
  autenticado: boolean;
  login: (correoElectronico: string, contrasena: string) => Promise<void>;
  logout: () => Promise<void>;
  refrescar: () => Promise<boolean>;
  /** Reemplaza los datos de la sesion (tras editar "Mi perfil"). */
  actualizarUsuario: (usuario: UsuarioAutenticado) => void;
  /** Cambia la contraseña propia y guarda los tokens nuevos que emite el backend. */
  cambiarContrasena: (dto: CambiarContrasenaDto) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarUsuario = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setUsuario(null);
      setCargando(false);
      return;
    }

    try {
      const datos = await authApi.obtenerYo();
      setUsuario(datos);
    } catch (error) {
      const es401 =
        error instanceof ApiError && (error.status === 401 || error.status === 403);
      if (es401) {
        const refreshToken = tokenStorage.getRefreshToken();
        if (refreshToken) {
          try {
            const tokens = await authApi.refresh(refreshToken);
            tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
            const datos = await authApi.obtenerYo();
            setUsuario(datos);
            setCargando(false);
            return;
          } catch {
            tokenStorage.clear();
            setUsuario(null);
            setCargando(false);
            return;
          }
        }
      }
      tokenStorage.clear();
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarUsuario();
  }, [cargarUsuario]);

  const login = useCallback(async (correoElectronico: string, contrasena: string) => {
    const tokens = await authApi.login({ correoElectronico, contrasena });
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    const datos = await authApi.obtenerYo();
    setUsuario(datos);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignorar errores al cerrar sesión
    } finally {
      tokenStorage.clear();
      setUsuario(null);
    }
  }, []);

  const refrescar = useCallback(async (): Promise<boolean> => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      setUsuario(null);
      return false;
    }

    try {
      const tokens = await authApi.refresh(refreshToken);
      tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      return true;
    } catch {
      tokenStorage.clear();
      setUsuario(null);
      return false;
    }
  }, []);

  const cambiarContrasena = useCallback(async (dto: CambiarContrasenaDto) => {
    const tokens = await authApi.cambiarContrasena(dto);
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    setUsuario(await authApi.obtenerYo());
  }, []);

  const value = useMemo(
    () => ({
      usuario,
      cargando,
      autenticado: usuario !== null,
      login,
      logout,
      refrescar,
      actualizarUsuario: setUsuario,
      cambiarContrasena,
    }),
    [usuario, cargando, login, logout, refrescar, cambiarContrasena],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
