import { useQuery } from "@tanstack/react-query";

import { nutricionistasApi } from "@/features/nutricionistas/api/nutricionistas-api";

export const nutricionistasKeys = {
  all: ["nutricionistas"] as const,
  lista: () => [...nutricionistasKeys.all, "lista"] as const,
};

/** El catalogo casi no cambia: se cachea largo para poblar los selectores. */
export function useNutricionistas() {
  return useQuery({
    queryKey: nutricionistasKeys.lista(),
    queryFn: nutricionistasApi.listar,
    staleTime: 5 * 60_000,
  });
}
