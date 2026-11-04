import axios from "axios";

import { ApiError, construirApiError } from "@/lib/api-error";
import type {
  CrearReservaDto,
  DiaPublico,
  Guid,
  OpcionesReserva,
  ReservaConfirmada,
} from "@/types/api";

/*
 * Cliente aparte, sin token ni renovacion de sesion: la reservacion es
 * publica y no debe depender (ni fallar) por una sesion del equipo abierta
 * en el mismo navegador.
 */
const clientePublico = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5036",
  timeout: 20_000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

clientePublico.interceptors.response.use(
  (respuesta) => respuesta,
  (error: unknown) => {
    if (axios.isAxiosError(error) && !error.response) {
      return Promise.reject(
        new ApiError("No pudimos conectar. Revisa tu internet e inténtalo de nuevo.", {
          status: 0,
          codigo: "ERROR_DE_RED",
        }),
      );
    }
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      return Promise.reject(
        new ApiError("Hiciste muchos intentos seguidos. Espera unos minutos y vuelve a intentarlo.", {
          status: 429,
          codigo: "ERROR_DESCONOCIDO",
        }),
      );
    }
    if (axios.isAxiosError(error)) {
      return Promise.reject(construirApiError(error.response?.status ?? 500, error.response?.data));
    }
    return Promise.reject(error);
  },
);

export const reservasApi = {
  opciones: async (): Promise<OpcionesReserva> => {
    const { data } = await clientePublico.get<OpcionesReserva>("/api/publico/reserva");
    return data;
  },

  /** Horas libres de "desde" a "hasta" (maximo 14 dias); sin id, de todo el equipo. */
  disponibilidad: async (params: { desde: string; hasta: string; nutricionistaId?: Guid }): Promise<DiaPublico[]> => {
    const { data } = await clientePublico.get<DiaPublico[]>("/api/publico/reserva/disponibilidad", { params });
    return data;
  },

  crear: async (dto: CrearReservaDto): Promise<ReservaConfirmada> => {
    const { data } = await clientePublico.post<ReservaConfirmada>("/api/publico/reserva", dto);
    return data;
  },
};
