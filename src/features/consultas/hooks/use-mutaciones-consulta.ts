import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { consultasApi } from "@/features/consultas/api/consultas-api";
import { consultasKeys } from "@/features/consultas/hooks/use-consultas";
import { citasKeys } from "@/features/citas/hooks/use-citas";
import { pacientesKeys } from "@/features/pacientes/hooks/use-pacientes";
import { ETIQUETA_TIPO_CONSULTA } from "@/features/consultas/lib/etiquetas-consulta";
import type { CrearConsultaDto, CerrarConsultaDto, Guid } from "@/types/api";

/**
 * `POST /api/consultas`. Al llevar `citaId`, el backend pone la cita en
 * `EnCurso` en la misma transacción, así que tras crear se refrescan también
 * las citas y se navega a la ficha de la consulta recién abierta.
 */
export function useCrearConsulta() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (datos: CrearConsultaDto) => consultasApi.crear(datos),
    onSuccess: (consulta) => {
      void queryClient.invalidateQueries({ queryKey: consultasKeys.all });
      void queryClient.invalidateQueries({ queryKey: citasKeys.all });
      void queryClient.invalidateQueries({
        queryKey: pacientesKeys.expediente(consulta.pacienteId),
      });
      toast.success("Consulta iniciada", {
        description: `${consulta.pacienteNombre} · ${ETIQUETA_TIPO_CONSULTA[consulta.tipoConsulta]}`,
      });
      navigate(`/consultas/${consulta.id}`);
    },
  });
}

/**
 * `PATCH /api/consultas/{id}/cerrar`: fija `fechaFin`, guarda las notas de
 * cierre y pone la cita en `Completada`. Si la consulta venía de una cita, se
 * vuelve a la agenda del día; si no, a la lista de consultas.
 */
export function useCerrarConsulta(consultaId: Guid) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (cierre: CerrarConsultaDto) => consultasApi.cerrar(consultaId, cierre),
    onSuccess: (consulta) => {
      void queryClient.invalidateQueries({ queryKey: consultasKeys.all });
      void queryClient.invalidateQueries({ queryKey: citasKeys.all });
      void queryClient.invalidateQueries({
        queryKey: pacientesKeys.expediente(consulta.pacienteId),
      });
      toast.success("Consulta cerrada", {
        description: consulta.pacienteNombre,
      });
      navigate(consulta.citaId ? "/citas" : "/consultas");
    },
  });
}
