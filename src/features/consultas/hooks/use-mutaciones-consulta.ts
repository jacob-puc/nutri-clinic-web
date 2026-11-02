import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { consultasApi } from "@/features/consultas/api/consultas-api";
import { consultasKeys } from "@/features/consultas/hooks/use-consultas";
import { citasKeys } from "@/features/citas/hooks/use-citas";
import { pacientesKeys } from "@/features/pacientes/hooks/use-pacientes";
import { ETIQUETA_TIPO_CONSULTA } from "@/features/consultas/lib/etiquetas-consulta";
import { esConflicto } from "@/lib/errores-formulario";
import type { Consulta, CrearConsultaDto, CerrarConsultaDto, Guid } from "@/types/api";

/**
 * Crea la consulta de una cita o, si la cita ya tiene una, la devuelve para
 * retomarla. Pasa al volver a una atención que se dejó a medias: la cita
 * sigue ofreciendo "Iniciar" y el backend respondería 409 ("La cita ... ya
 * tiene la consulta ... registrada"). Primero se crea, que es el caso normal,
 * y solo ante el conflicto se busca la existente.
 */
async function crearORetomar(datos: CrearConsultaDto): Promise<{ consulta: Consulta; retomada: boolean }> {
  try {
    return { consulta: await consultasApi.crear(datos), retomada: false };
  } catch (error) {
    if (datos.citaId && esConflicto(error)) {
      const existente = await consultasApi.obtenerPorCita(datos.citaId);
      if (existente) return { consulta: existente, retomada: true };
    }
    throw error;
  }
}

/**
 * `POST /api/consultas`. Al llevar `citaId`, el backend pone la cita en
 * `EnCurso` en la misma transacción, así que tras crear se refrescan también
 * las citas y se navega a la ficha de la consulta recién abierta.
 */
export function useCrearConsulta() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: crearORetomar,
    onSuccess: ({ consulta, retomada }) => {
      void queryClient.invalidateQueries({ queryKey: consultasKeys.all });
      void queryClient.invalidateQueries({ queryKey: citasKeys.all });
      void queryClient.invalidateQueries({
        queryKey: pacientesKeys.expediente(consulta.pacienteId),
      });
      if (retomada) {
        toast.info("Retomando la consulta en curso", { description: consulta.pacienteNombre });
      } else {
        toast.success("Consulta iniciada", {
          description: `${consulta.pacienteNombre} · ${ETIQUETA_TIPO_CONSULTA[consulta.tipoConsulta]}`,
        });
      }
      navigate(`/consultas/${consulta.id}`);
    },
  });
}

/**
 * `PATCH /api/consultas/{id}/cerrar`: fija `fechaFin`, guarda las notas de
 * cierre y pone la cita en `Completada`. Si la consulta venía de una cita, se
 * vuelve a la agenda del día; si no, a la lista de consultas.
 */
export function useCerrarConsulta(consultaId: Guid, { navegar = true }: { navegar?: boolean } = {}) {
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
      /* Sin navegar: la consulta abre el cobro y navega al terminarlo. */
      if (navegar) navigate(consulta.citaId ? "/citas" : "/consultas");
    },
  });
}
