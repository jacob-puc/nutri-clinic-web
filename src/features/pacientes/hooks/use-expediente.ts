import { useQuery } from "@tanstack/react-query";

import { pacientesApi } from "@/features/pacientes/api/pacientes-api";
import { pacientesKeys } from "@/features/pacientes/hooks/use-pacientes";
import type { Guid } from "@/types/api";

/**
 * Ficha de un paciente. `GET /api/pacientes/{id}` trae los datos de contacto
 * completos, incluido `direccion`, que el expediente agregado no devuelve.
 */
export function usePaciente(id: Guid | undefined) {
  return useQuery({
    queryKey: pacientesKeys.detalle(id ?? ""),
    queryFn: () => pacientesApi.obtenerPorId(id as Guid),
    // Sin id no hay nada que pedir. Sin esto la query se dispara, falla con un
    // 404 y muestra el estado de error en una pagina que todavia no existe.
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/**
 * Expediente agregado. UNA sola llamada trae historial clinico, medidas,
 * fotos y documentos, asi que las cuatro pestañas comparten cache y no se
 * hacen cuatro requests al abrir la ficha.
 */
export function useExpediente(id: Guid | undefined) {
  return useQuery({
    queryKey: pacientesKeys.expediente(id ?? ""),
    queryFn: () => pacientesApi.obtenerExpediente(id as Guid),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}
