import { apiClient } from "@/lib/api-client";
import type {
  CambiarContrasenaDto,
  LoginDto,
  TokenRespuestaDto,
  UsuarioAutenticado,
} from "@/features/auth/types/auth";
import type { ActualizarNutricionistaDto } from "@/types/api";

export const authApi = {
  login: async (credenciales: LoginDto): Promise<TokenRespuestaDto> => {
    const { data } = await apiClient.post<TokenRespuestaDto>(
      "/api/auth/login",
      credenciales,
    );
    return data;
  },

  refresh: async (refreshToken: string): Promise<TokenRespuestaDto> => {
    const { data } = await apiClient.post<TokenRespuestaDto>(
      "/api/auth/refresh",
      { refreshToken },
    );
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/api/auth/logout");
  },

  obtenerYo: async (): Promise<UsuarioAutenticado> => {
    const { data } = await apiClient.get<UsuarioAutenticado>("/api/auth/yo");
    return data;
  },

  actualizarPerfil: async (dto: ActualizarNutricionistaDto): Promise<UsuarioAutenticado> => {
    const { data } = await apiClient.put<UsuarioAutenticado>("/api/auth/yo", dto);
    return data;
  },

  /** Devuelve tokens nuevos: los anteriores aun llevaban la marca de contraseña temporal. */
  cambiarContrasena: async (dto: CambiarContrasenaDto): Promise<TokenRespuestaDto> => {
    const { data } = await apiClient.post<TokenRespuestaDto>("/api/auth/cambiar-contrasena", dto);
    return data;
  },
};
