import { apiClient } from "@/lib/api-client";
import { traerTodasLasHojas } from "@/lib/paginacion";
import type {
  ActualizarCitaDto,
  CambiarEstadoCitaDto,
  Cita,
  CitaFiltro,
  CrearCitaDto,
  Guid,
  RespuestaPaginada,
} from "@/types/api";

/** Ver `traerTodasLasHojas`: el conjunto completo por rango, no una página. */
export const citasApi = {
  listar: async (filtro: CitaFiltro = {}): Promise<Cita[]> =>
    traerTodasLasHojas<Cita>("/api/citas", { ...filtro }),

  obtenerPorId: async (citaId: Guid): Promise<Cita> => {
    const { data } = await apiClient.get<Cita>(`/api/citas/${citaId}`);
    return data;
  },

  listarPorPaciente: async (pacienteId: Guid): Promise<Cita[]> => {
    const { data } = await apiClient.get<Cita[] | RespuestaPaginada<Cita>>(
      `/api/pacientes/${pacienteId}/citas`,
    );
    return Array.isArray(data) ? data : (data.datos ?? []);
  },

  crear: async (cita: CrearCitaDto): Promise<Cita> => {
    const { data } = await apiClient.post<Cita>("/api/citas", cita);
    return data;
  },

  actualizar: async (citaId: Guid, cambios: ActualizarCitaDto): Promise<Cita> => {
    const { data } = await apiClient.put<Cita>(`/api/citas/${citaId}`, cambios);
    return data;
  },

  cambiarEstado: async (
    citaId: Guid,
    cambio: CambiarEstadoCitaDto,
  ): Promise<Cita> => {
    const { data } = await apiClient.patch<Cita>(
      `/api/citas/${citaId}/estado`,
      cambio,
    );
    return data;
  },

  eliminar: async (citaId: Guid): Promise<void> => {
    await apiClient.delete(`/api/citas/${citaId}`);
  },
};
