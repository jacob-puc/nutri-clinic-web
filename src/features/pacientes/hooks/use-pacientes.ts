import { useQuery } from "@tanstack/react-query";

import { pacientesApi } from "@/features/pacientes/api/pacientes-api";

/**
 * Claves de cache centralizadas. Centralizarlas evita typos silenciosos:
 * un string mal escrito en un invalidateQueries no invalida nada y la UI
 * muestra datos viejos sin avisar.
 */
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
    // La lista cambia cuando se da de alta un paciente; 30 s es suficiente
    // sin castigar al backend.
    staleTime: 30_000,
  });
}
