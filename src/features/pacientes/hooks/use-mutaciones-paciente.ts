import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { pacientesApi } from "@/features/pacientes/api/pacientes-api";
import { pacientesKeys } from "@/features/pacientes/hooks/use-pacientes";
import type {
  ActualizarObjetivoPacienteDto,
  CrearMedidaDto,
  CrearPacienteDto,
  Guid,
  SubirDocumentoDto,
  SubirFotoDto,
} from "@/types/api";

export function useCrearPaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CrearPacienteDto) => pacientesApi.crear(datos),
    onSuccess: (paciente) => {
      void queryClient.invalidateQueries({ queryKey: pacientesKeys.lista() });
      toast.success("Paciente registrado", {
        description: paciente.nombreCompleto,
      });
    },
  });
}

export function useActualizarPaciente(id: Guid) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: Partial<CrearPacienteDto>) =>
      pacientesApi.actualizar(id, datos),
    onSuccess: (paciente) => {
      void queryClient.invalidateQueries({ queryKey: pacientesKeys.lista() });
      void queryClient.invalidateQueries({
        queryKey: pacientesKeys.detalle(id),
      });
      toast.success("Cambios guardados", {
        description: paciente.nombreCompleto,
      });
    },
  });
}

export function useActualizarObjetivo(id: Guid) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (objetivo: ActualizarObjetivoPacienteDto) =>
      pacientesApi.actualizarObjetivo(id, objetivo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pacientesKeys.lista() });
      void queryClient.invalidateQueries({
        queryKey: pacientesKeys.detalle(id),
      });
    },
  });
}

export function useRegistrarMedida(pacienteId: Guid) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CrearMedidaDto) =>
      pacientesApi.registrarMedida(pacienteId, datos),
    onSuccess: (medida) => {
      void queryClient.invalidateQueries({
        queryKey: pacientesKeys.expediente(pacienteId),
      });
      toast.success("Medicion registrada", {
        description: `${medida.peso} kg · IMC ${medida.imc}`,
      });
    },
  });
}

/**
 * Refresca el expediente (fotos/documentos viven ahí). Si la subida se hizo
 * desde una consulta, también se invalida el módulo de consultas para que la
 * ficha de la consulta muestre el archivo recién añadido.
 */
export function useSubirFoto(pacienteId: Guid) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: SubirFotoDto) => pacientesApi.subirFoto(pacienteId, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: pacientesKeys.expediente(pacienteId),
      });
      void queryClient.invalidateQueries({ queryKey: ["consultas"] });
      toast.success("Foto subida");
    },
  });
}

export function useSubirDocumento(pacienteId: Guid) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: SubirDocumentoDto) =>
      pacientesApi.subirDocumento(pacienteId, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: pacientesKeys.expediente(pacienteId),
      });
      void queryClient.invalidateQueries({ queryKey: ["consultas"] });
      toast.success("Documento subido");
    },
  });
}
