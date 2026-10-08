import { apiClient } from "@/lib/api-client";
import type { LoginDto, TokenRespuestaDto, UsuarioAutenticado } from "@/features/auth/types/auth";

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
};
