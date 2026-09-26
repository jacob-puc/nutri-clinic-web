import axios from "axios";

import { ApiError, construirApiError } from "@/lib/api-error";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5036";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Un interceptor unico para toda la app: convierte cualquier fallo en un
 * `ApiError`. Los hooks de react-query reciben siempre el mismo tipo, asi que
 * las vistas no tienen que distinguir entre "fallo de red" y "error de
 * validacion" en cada pantalla.
 */
apiClient.interceptors.response.use(
  (respuesta) => respuesta,
  (error: unknown) => {
    // Sin respuesta: backend apagado, CORS, DNS, timeout.
    if (axios.isAxiosError(error) && !error.response) {
      return Promise.reject(
        new ApiError("No hay conexion con el servidor de la API.", {
          status: 0,
          codigo: "ERROR_DE_RED",
        }),
      );
    }

    if (axios.isAxiosError(error)) {
      const { status, data } = error.response ?? {};
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
