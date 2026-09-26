import { useQuery } from "@tanstack/react-query";

import { pacientesApi } from "@/features/pacientes/api/pacientes-api";

export const pacientesKeys = {
  all: ["pacientes"] as const,
  lista: () => [...pacientesKeys.all, "lista"] as const,
  detalle: (id: string) => [...pacientesKeys.all, "detalle", id] as const,
  expediente: (id: string) => [...pacientesKeys.all, "expediente", id] as const,
};

export function usePacientes() {
  return useQuery({
    queryKey: pacientesKeys.lista(),
    queryFn: pacientesApi.listar,
    staleTime: 30_000,
  });
}
