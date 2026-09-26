import { useQuery } from "@tanstack/react-query";

import { pacientesApi } from "@/features/pacientes/api/pacientes-api";
import { pacientesKeys } from "@/features/pacientes/hooks/use-pacientes";
import type { Guid } from "@/types/api";

export function usePaciente(id: Guid | undefined) {
  return useQuery({
    queryKey: pacientesKeys.detalle(id ?? ""),
    queryFn: () => pacientesApi.obtenerPorId(id as Guid),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useExpediente(id: Guid | undefined) {
  return useQuery({
    queryKey: pacientesKeys.expediente(id ?? ""),
    queryFn: () => pacientesApi.obtenerExpediente(id as Guid),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}
