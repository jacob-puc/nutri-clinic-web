import { apiClient } from "@/lib/api-client";
import type {
  CrearPacienteDto,
  ExpedienteCompleto,
  Guid,
  Paciente,
} from "@/types/api";

/**
 * Endpoints de pacientes.
 *
 * Nota: la API no expone paginacion ni orden. `GET /api/pacientes` devuelve
 * solo los pacientes activos (IsActive = true) en el orden que Postgres
 * entregue, que no es estable entre llamadas. Por eso el ordenamiento por
 * nombre se hace en el cliente, en la vista, no aqui.
 */
export const pacientesApi = {
  listar: async (): Promise<Paciente[]> => {
    const { data } = await apiClient.get<Paciente[]>("/api/pacientes");
    return data;
  },

  obtenerPorId: async (id: Guid): Promise<Paciente> => {
    const { data } = await apiClient.get<Paciente>(`/api/pacientes/${id}`);
    return data;
  },

  /** Vista agregada: historial + medidas + fotos + documentos en una llamada. */
  obtenerExpediente: async (id: Guid): Promise<ExpedienteCompleto> => {
    const { data } = await apiClient.get<ExpedienteCompleto>(
      `/api/pacientes/${id}/expediente`,
    );
    return data;
  },

  crear: async (paciente: CrearPacienteDto): Promise<Paciente> => {
    const { data } = await apiClient.post<Paciente>("/api/pacientes", paciente);
    return data;
  },
};
