import { apiClient } from "@/lib/api-client";
import type {
  ActualizarHorarioPersonaDto,
  Ausencia,
  AusenciaCreada,
  BloqueHorario,
  CrearAusenciaDto,
  Disponibilidad,
  HorarioPersona,
  Horarios,
  ActualizarNutricionistaDto,
  CitaPendiente,
  CrearNutricionistaDto,
  Guid,
  Nutricionista,
  ResultadoReasignacion,
} from "@/types/api";

export const nutricionistasApi = {
  listar: async (incluirInactivos = false): Promise<Nutricionista[]> => {
    const { data } = await apiClient.get<Nutricionista[]>("/api/nutricionistas", {
      params: incluirInactivos ? { incluirInactivos: true } : undefined,
    });
    return data;
  },

  obtener: async (id: Guid): Promise<Nutricionista> => {
    const { data } = await apiClient.get<Nutricionista>(`/api/nutricionistas/${id}`);
    return data;
  },

  crear: async (dto: CrearNutricionistaDto): Promise<Nutricionista> => {
    const { data } = await apiClient.post<Nutricionista>("/api/nutricionistas", dto);
    return data;
  },

  actualizar: async (id: Guid, dto: ActualizarNutricionistaDto): Promise<Nutricionista> => {
    const { data } = await apiClient.put<Nutricionista>(`/api/nutricionistas/${id}`, dto);
    return data;
  },

  desactivar: async (id: Guid): Promise<void> => {
    await apiClient.delete(`/api/nutricionistas/${id}`);
  },

  reactivar: async (id: Guid): Promise<Nutricionista> => {
    const { data } = await apiClient.post<Nutricionista>(`/api/nutricionistas/${id}/reactivar`);
    return data;
  },

  /** Contraseña temporal: la cuenta debe cambiarla al entrar. */
  restablecerContrasena: async (id: Guid, contrasena: string): Promise<void> => {
    await apiClient.put(`/api/nutricionistas/${id}/contrasena`, { contrasena });
  },

  citasPendientes: async (id: Guid): Promise<CitaPendiente[]> => {
    const { data } = await apiClient.get<CitaPendiente[]>(`/api/nutricionistas/${id}/citas-pendientes`);
    return data;
  },

  /** Con desde/hasta ("YYYY-MM-DD") solo mueve las citas de esos dias. */
  reasignarCitas: async (
    id: Guid,
    nutricionistaDestinoId: Guid,
    rango?: { desde: string; hasta: string },
  ): Promise<ResultadoReasignacion> => {
    const { data } = await apiClient.post<ResultadoReasignacion>(`/api/nutricionistas/${id}/reasignar-citas`, {
      nutricionistaDestinoId,
      ...rango,
    });
    return data;
  },

  horarios: async (): Promise<Horarios> => {
    const { data } = await apiClient.get<Horarios>("/api/horarios");
    return data;
  },

  actualizarHorarioClinica: async (bloques: BloqueHorario[]): Promise<Horarios> => {
    const { data } = await apiClient.put<Horarios>("/api/horarios/clinica", { bloques });
    return data;
  },

  actualizarHorario: async (id: Guid, dto: ActualizarHorarioPersonaDto): Promise<HorarioPersona> => {
    const { data } = await apiClient.put<HorarioPersona>(`/api/nutricionistas/${id}/horario`, dto);
    return data;
  },

  /** Ausencias vigentes y futuras de todo el equipo. */
  ausencias: async (): Promise<Ausencia[]> => {
    const { data } = await apiClient.get<Ausencia[]>("/api/ausencias");
    return data;
  },

  crearAusencia: async (id: Guid, dto: CrearAusenciaDto): Promise<AusenciaCreada> => {
    const { data } = await apiClient.post<AusenciaCreada>(`/api/nutricionistas/${id}/ausencias`, dto);
    return data;
  },

  /** Huecos libres entre dos fechas "YYYY-MM-DD" (maximo 31 dias). */
  disponibilidad: async (
    id: Guid,
    params: { desde: string; hasta?: string; duracion?: number; paso?: number },
  ): Promise<Disponibilidad> => {
    const { data } = await apiClient.get<Disponibilidad>(`/api/nutricionistas/${id}/disponibilidad`, { params });
    return data;
  },

  eliminarAusencia: async (id: Guid, ausenciaId: Guid): Promise<void> => {
    await apiClient.delete(`/api/nutricionistas/${id}/ausencias/${ausenciaId}`);
  },
};
