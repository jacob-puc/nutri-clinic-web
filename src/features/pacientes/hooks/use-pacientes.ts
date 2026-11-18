import { useQuery } from "@tanstack/react-query";

import { pacientesApi } from "@/features/pacientes/api/pacientes-api";

export const pacientesKeys = {
  all: ["pacientes"] as const,
  lista: () => [...pacientesKeys.all, "lista"] as const,
  detalle: (id: string) => [...pacientesKeys.all, "detalle", id] as const,
  expediente: (id: string) => [...pacientesKeys.all, "expediente", id] as const,
  estadosApp: () => [...pacientesKeys.all, "estados-app"] as const,
};

/** Quien usa la app y a quien ya se invito, indexado por paciente. */
export function useEstadosApp() {
  return useQuery({
    queryKey: pacientesKeys.estadosApp(),
    queryFn: pacientesApi.estadosApp,
    staleTime: 60_000,
    select: (lista) => new Map(lista.map((e) => [e.pacienteId, e])),
  });
}

export function usePacientes() {
  return useQuery({
    queryKey: pacientesKeys.lista(),
    queryFn: pacientesApi.listar,
    staleTime: 30_000,
  });
}
