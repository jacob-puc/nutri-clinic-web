import axios from "axios";

import { ApiError, construirApiError } from "@/lib/api-error";
import type { TokenRespuestaDto } from "@/features/auth/types/auth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5036";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("nc_access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (respuesta) => respuesta,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && !error.response) {
      return Promise.reject(
        new ApiError("No hay conexion con el servidor de la API.", {
          status: 0,
          codigo: "ERROR_DE_RED",
        }),
      );
    }

    if (axios.isAxiosError(error)) {
      const { status, data, config } = error.response ?? {};
      const url = config?.url ?? "";

      if (
        status === 401 &&
        url !== "/api/auth/login" &&
        url !== "/api/auth/refresh"
      ) {
        const refreshToken = localStorage.getItem("nc_refresh_token");
        if (refreshToken && config) {
          try {
            const { data: tokens } = await axios.post<TokenRespuestaDto>(
              `${BASE_URL}/api/auth/refresh`,
              { refreshToken },
              {
                headers: { "Content-Type": "application/json" },
                timeout: 20_000,
              },
            );
            localStorage.setItem("nc_access_token", tokens.accessToken);
            localStorage.setItem("nc_refresh_token", tokens.refreshToken);

            const nuevaConfig = {
              ...config,
              headers: {
                ...config.headers,
                Authorization: `Bearer ${tokens.accessToken}`,
              },
            };

            return axios.request(nuevaConfig);
          } catch (refreshError) {
            localStorage.removeItem("nc_access_token");
            localStorage.removeItem("nc_refresh_token");
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(
              new ApiError("La sesión expiró. Inicia sesión nuevamente.", {
                status: 401,
                codigo: "SESION_EXPIRADA",
              }),
            );
          }
        }
      }

      return Promise.reject(construirApiError(status ?? 500, data));
    }

    return Promise.reject(
      new ApiError("Fallo inesperado en la comunicacion.", {
        status: 500,
        codigo: "ERROR_DESCONOCIDO",
      }),
    );
  },
);
