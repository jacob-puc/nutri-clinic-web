import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { enviosApi, type EnviarDocumentoDto, type TipoDocumento } from "@/features/envios/api/envios-api";
import type { Guid } from "@/types/api";

export const enviosKeys = {
  todos: ["envios"] as const,
  documento: (referenciaId: Guid) => ["envios", referenciaId] as const,
};

/**
 * Envios de un documento. Mientras alguno esta en cola se vuelve a
 * consultar cada pocos segundos para mostrar cuando ya salio.
 */
export function useEnvios(referenciaId: Guid | undefined, activo = true) {
  return useQuery({
    queryKey: enviosKeys.documento(referenciaId ?? ""),
    queryFn: () => enviosApi.listar(referenciaId as Guid),
    enabled: Boolean(referenciaId) && activo,
    refetchInterval: (consulta) =>
      consulta.state.data?.some((e) => e.estado === "Pendiente") ? 4000 : false,
  });
}

export function useEnviarDocumento(tipo: TipoDocumento, referenciaId: Guid) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (dto: EnviarDocumentoDto) => enviosApi.enviar(tipo, referenciaId, dto),
    onSuccess: () => cliente.invalidateQueries({ queryKey: enviosKeys.documento(referenciaId) }),
  });
}
