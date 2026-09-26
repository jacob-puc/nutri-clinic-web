import { apiClient } from "@/lib/api-client";
import type {
  CrearPacienteDto,
  ExpedienteCompleto,
  Guid,
  Paciente,
} from "@/types/api";

export const pacientesApi = {
  listar: async (): Promise<Paciente[]> => {
    const { data } = await apiClient.get<Paciente[]>("/api/pacientes");
    return data;
  },

  obtenerPorId: async (id: Guid): Promise<Paciente> => {
    const { data } = await apiClient.get<Paciente>(`/api/pacientes/${id}`);
    return data;
  },

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

  actualizar: async (
    id: Guid,
    cambios: Partial<CrearPacienteDto>,
  ): Promise<Paciente> => {
    const { data } = await apiClient.put<Paciente>(
      `/api/pacientes/${id}`,
      cambios,
    );
    return data;
  },

  /** Baja logica: el backend marca `IsActive = false` y conserva el historial. */
  darDeBaja: async (id: Guid): Promise<void> => {
    await apiClient.delete(`/api/pacientes/${id}`);
  },
};
