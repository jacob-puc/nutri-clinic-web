import { useCrearConsulta } from "@/features/consultas/hooks/use-mutaciones-consulta";
import { useConsultasDePaciente } from "@/features/consultas/hooks/use-consultas";
import { deducirTipoConsulta } from "@/features/consultas/lib/tipo-consulta";
import type { Cita } from "@/types/api";

/**
 * Arranca la atención de una cita confirmada. En lugar de hacer un `PATCH` de
 * estado suelto, crea la consulta (que el backend enlaza a la cita y la pasa a
 * `EnCurso` en la misma transacción) y navega a su espacio de trabajo.
 *
 * El tipo de consulta se deduce del historial del paciente: `Inicial` si es su
 * primera, `Seguimiento` en adelante. Pensado para el componente de una sola
 * cita (`AccionesCita`); la cola del día usa `useCrearConsulta` directo con el
 * conteo global para no repetir una petición por fila.
 */
export function useIniciarAtencion(cita: Cita) {
  const crear = useCrearConsulta();
  const historial = useConsultasDePaciente(cita.pacienteId);

  return {
    /** `true` mientras se crea la consulta (y la cita pasa a EnCurso). */
    pendiente: crear.isPending,
    iniciar: () =>
      crear.mutate({
        pacienteId: cita.pacienteId,
        citaId: cita.id,
        nutricionistaId: cita.nutricionistaId,
        tipoConsulta: deducirTipoConsulta((historial.data ?? []).length),
      }),
  };
}
