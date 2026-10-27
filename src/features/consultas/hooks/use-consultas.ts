import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { consultasApi } from "@/features/consultas/api/consultas-api";
import type { ConsultaFiltro, Guid } from "@/types/api";

export const consultasKeys = {
  all: ["consultas"] as const,
  lista: (filtro: ConsultaFiltro) => [...consultasKeys.all, "lista", filtro] as const,
  detalle: (id: Guid) => [...consultasKeys.all, "detalle", id] as const,
  porCita: (citaId: Guid) => [...consultasKeys.all, "cita", citaId] as const,
  porPaciente: (pacienteId: Guid) =>
    [...consultasKeys.all, "paciente", pacienteId] as const,
};

export function useConsultas(filtro: ConsultaFiltro = {}) {
  return useQuery({
    queryKey: consultasKeys.lista(filtro),
    queryFn: () => consultasApi.listar(filtro),
    staleTime: 15_000,
    /* El filtro entra en la queryKey: al cambiar de día la cola se recarga sin
       desmontarse, igual que la agenda. */
    placeholderData: keepPreviousData,
  });
}

export function useConsulta(consultaId: Guid | undefined) {
  return useQuery({
    queryKey: consultasKeys.detalle(consultaId ?? ""),
    queryFn: () => consultasApi.obtenerPorId(consultaId as Guid),
    enabled: Boolean(consultaId),
    staleTime: 30_000,
  });
}

export function useConsultaPorCita(citaId: Guid | undefined) {
  return useQuery({
    queryKey: consultasKeys.porCita(citaId ?? ""),
    queryFn: () => consultasApi.obtenerPorCita(citaId as Guid),
    enabled: Boolean(citaId),
    staleTime: 15_000,
  });
}

export function useConsultasDePaciente(pacienteId: Guid | undefined) {
  return useQuery({
    queryKey: consultasKeys.porPaciente(pacienteId ?? ""),
    queryFn: () => consultasApi.listarPorPaciente(pacienteId as Guid),
    enabled: Boolean(pacienteId),
    staleTime: 30_000,
  });
}
