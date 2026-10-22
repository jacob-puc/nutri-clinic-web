import { apiClient } from "@/lib/api-client";
import type {
  ActualizarCitaDto,
  CambiarEstadoCitaDto,
  Cita,
  CitaFiltro,
  CrearCitaDto,
  Guid,
  RespuestaPaginada,
} from "@/types/api";

/** Tope que aplica el backend a TamanoPagina. */
const TAMANO_HOJA = 100;
/** Red de seguridad ante un totalPaginas patologico: 10 hojas = 1000 citas. */
const MAX_HOJAS = 10;

/**
 * GET /api/citas es paginado en el backend. El calendario consulta por rango
 * (mes/semana visible) y necesita el conjunto completo, asi que se pide la
 * hoja mas grande posible y se recorren las restantes en lugar de truncar en
 * silencio. El desempaquetado tolera tambien que el endpoint vuelva a
 * devolver una lista plana.
 */
function desempaquetar(data: Cita[] | RespuestaPaginada<Cita>): Cita[] {
  return Array.isArray(data) ? data : (data.datos ?? []);
}

export const citasApi = {
  listar: async (filtro: CitaFiltro = {}): Promise<Cita[]> => {
    const base = { ...filtro, tamanoPagina: TAMANO_HOJA };
    const { data } = await apiClient.get<Cita[] | RespuestaPaginada<Cita>>(
      "/api/citas",
      { params: { ...base, pagina: 1 } },
    );

    const primeraHoja = desempaquetar(data);
    if (Array.isArray(data) || data.totalPaginas <= 1) return primeraHoja;

    const hojas = await Promise.all(
      Array.from({ length: Math.min(data.totalPaginas, MAX_HOJAS) - 1 }, (_, i) =>
        apiClient
          .get<RespuestaPaginada<Cita>>("/api/citas", {
            params: { ...base, pagina: i + 2 },
          })
          .then((respuesta) => desempaquetar(respuesta.data)),
      ),
    );

    return [...primeraHoja, ...hojas.flat()];
  },

  obtenerPorId: async (citaId: Guid): Promise<Cita> => {
    const { data } = await apiClient.get<Cita>(`/api/citas/${citaId}`);
    return data;
  },

  listarPorPaciente: async (pacienteId: Guid): Promise<Cita[]> => {
    const { data } = await apiClient.get<Cita[] | RespuestaPaginada<Cita>>(
      `/api/pacientes/${pacienteId}/citas`,
    );
    return desempaquetar(data);
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
