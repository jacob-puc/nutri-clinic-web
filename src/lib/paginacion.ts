import { apiClient } from "@/lib/api-client";
import type { RespuestaPaginada } from "@/types/api";

/** Tope que aplica el backend a `TamanoPagina`. */
const TAMANO_HOJA = 100;
/** Red de seguridad ante un `totalPaginas` patológico: 10 hojas = 1000 registros. */
const MAX_HOJAS = 10;

/**
 * `GET /api/citas` y `GET /api/consultas` devuelven envoltorio paginado, pero
 * el calendario y la cola de consultas piensan en conjuntos completos, no en
 * páginas. Se pide la hoja más grande posible y se recorren las restantes en
 * lugar de truncar en silencio.
 *
 * Tolera además que el endpoint vuelva a devolver una lista plana, que era su
 * comportamiento antes del paginado.
 */
export async function traerTodasLasHojas<T>(
  url: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const { data } = await apiClient.get<T[] | RespuestaPaginada<T>>(url, {
    params: { ...params, tamanoPagina: TAMANO_HOJA, pagina: 1 },
  });

  if (Array.isArray(data)) return data;

  const primeraHoja = data.datos ?? [];
  if (data.totalPaginas <= 1) return primeraHoja;

  const hojas = await Promise.all(
    Array.from({ length: Math.min(data.totalPaginas, MAX_HOJAS) - 1 }, (_, i) =>
      apiClient
        .get<RespuestaPaginada<T>>(url, {
          params: { ...params, tamanoPagina: TAMANO_HOJA, pagina: i + 2 },
        })
        .then((respuesta) => respuesta.data.datos ?? []),
    ),
  );

  return [...primeraHoja, ...hojas.flat()];
}
