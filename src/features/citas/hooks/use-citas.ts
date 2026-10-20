import { useQuery } from "@tanstack/react-query";

import { citasApi } from "@/features/citas/api/citas-api";
import type { CitaFiltro, Guid } from "@/types/api";

export const citasKeys = {
  all: ["citas"] as const,
  lista: (filtro: CitaFiltro) => [...citasKeys.all, "lista", filtro] as const,
  detalle: (id: Guid) => [...citasKeys.all, "detalle", id] as const,
  porPaciente: (pacienteId: Guid) =>
    [...citasKeys.all, "paciente", pacienteId] as const,
};

export function useCitas(
  filtro: CitaFiltro = {},
  opciones: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: citasKeys.lista(filtro),
    queryFn: () => citasApi.listar(filtro),
    staleTime: 30_000,
    enabled: opciones.enabled ?? true,
  });
}

export function useCita(citaId: Guid | undefined) {
  return useQuery({
    queryKey: citasKeys.detalle(citaId ?? ""),
    queryFn: () => citasApi.obtenerPorId(citaId as Guid),
    enabled: Boolean(citaId),
    staleTime: 30_000,
  });
}

export function useCitasDePaciente(pacienteId: Guid | undefined) {
  return useQuery({
    queryKey: citasKeys.porPaciente(pacienteId ?? ""),
    queryFn: () => citasApi.listarPorPaciente(pacienteId as Guid),
    enabled: Boolean(pacienteId),
    staleTime: 30_000,
  });
}
