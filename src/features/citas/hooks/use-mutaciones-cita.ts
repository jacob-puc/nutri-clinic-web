import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { citasApi } from "@/features/citas/api/citas-api";
import { citasKeys } from "@/features/citas/hooks/use-citas";
import { ETIQUETA_ESTADO_CITA } from "@/features/citas/lib/estados-cita";
import type {
  ActualizarCitaDto,
  CambiarEstadoCitaDto,
  CrearCitaDto,
  Guid,
} from "@/types/api";

export function useCrearCita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CrearCitaDto) => citasApi.crear(datos),
    onSuccess: (cita) => {
      // Cubre agenda y ficha del paciente: ambas viven bajo ["citas"].
      void queryClient.invalidateQueries({ queryKey: citasKeys.all });
      toast.success("Cita agendada", { description: cita.pacienteNombre });
    },
  });
}

export function useActualizarCita(citaId: Guid) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: ActualizarCitaDto) => citasApi.actualizar(citaId, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: citasKeys.all });
    },
  });
}

export function useCambiarEstadoCita(citaId: Guid) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CambiarEstadoCitaDto) =>
      citasApi.cambiarEstado(citaId, datos),
    onSuccess: (cita) => {
      void queryClient.invalidateQueries({ queryKey: citasKeys.all });
      toast.success("Cita actualizada", {
        description: ETIQUETA_ESTADO_CITA[cita.estado],
      });
    },
  });
}

export function useEliminarCita(citaId: Guid) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => citasApi.eliminar(citaId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: citasKeys.all });
      toast.success("Cita eliminada");
    },
  });
}
