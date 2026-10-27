import { apiClient } from "@/lib/api-client";
import { traerTodasLasHojas } from "@/lib/paginacion";
import type {
  Consulta,
  CrearConsultaDto,
  CerrarConsultaDto,
  ConsultaFiltro,
  Guid,
} from "@/types/api";

/**
 * Cliente del módulo de consultas. La creación con `citaId` es la que cierra
 * el circuito clínico: el backend pone la cita en `EnCurso` en el mismo paso.
 */
export const consultasApi = {
  /**
   * `GET /api/consultas` viene paginado; la cola del día y el historial
   * piensan en conjuntos completos, así que se recorren las hojas.
   */
  listar: async (filtro: ConsultaFiltro = {}): Promise<Consulta[]> =>
    traerTodasLasHojas<Consulta>("/api/consultas", { ...filtro }),

  obtenerPorId: async (consultaId: Guid): Promise<Consulta> => {
    const { data } = await apiClient.get<Consulta>(`/api/consultas/${consultaId}`);
    return data;
  },

  /** `GET /api/consultas/cita/{id}` devuelve 404 con un string plano si no existe. */
  obtenerPorCita: async (citaId: Guid): Promise<Consulta | null> => {
    try {
      const { data } = await apiClient.get<Consulta>(`/api/consultas/cita/${citaId}`);
      return data;
    } catch (error) {
      // Sin consulta abierta para esa cita: no es un fallo, es "todavía no".
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      throw error;
    }
  },

  listarPorPaciente: async (pacienteId: Guid): Promise<Consulta[]> => {
    const { data } = await apiClient.get<Consulta[]>(`/api/pacientes/${pacienteId}/consultas`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * `POST /api/consultas` (201). Al llevar `citaId`, el backend marca la cita
   * `EnCurso` en la misma transacción: no hace falta un `PATCH` de estado aparte.
   */
  crear: async (consulta: CrearConsultaDto): Promise<Consulta> => {
    const { data } = await apiClient.post<Consulta>("/api/consultas", consulta);
    return data;
  },

  /**
   * `PATCH /api/consultas/{id}/cerrar`. Fija `fechaFin` (la pone el backend si no
   * viaja) y guarda las notas de cierre; además la cita pasa a `Completada`.
   *
   * El backend todavía no expone un `PUT` de consulta, así que `notasClinicas`
   * solo se escriben al crear y al cerrar.
   */
  cerrar: async (consultaId: Guid, cierre: CerrarConsultaDto): Promise<Consulta> => {
    const { data } = await apiClient.patch<Consulta>(
      `/api/consultas/${consultaId}/cerrar`,
      cierre,
    );
    return data;
  },
};
