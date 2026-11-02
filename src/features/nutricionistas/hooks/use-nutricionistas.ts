import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { atiendePacientes } from "@/features/auth/lib/permisos";
import { nutricionistasApi } from "@/features/nutricionistas/api/nutricionistas-api";
import type {
  ActualizarHorarioPersonaDto,
  ActualizarNutricionistaDto,
  BloqueHorario,
  CrearAusenciaDto,
  CrearNutricionistaDto,
  Guid,
} from "@/types/api";

export const nutricionistasKeys = {
  all: ["nutricionistas"] as const,
  lista: (incluirInactivos = false) => [...nutricionistasKeys.all, "lista", { incluirInactivos }] as const,
  detalle: (id: Guid) => [...nutricionistasKeys.all, "detalle", id] as const,
  pendientes: (id: Guid) => [...nutricionistasKeys.all, "pendientes", id] as const,
  horarios: () => [...nutricionistasKeys.all, "horarios"] as const,
  ausencias: () => [...nutricionistasKeys.all, "ausencias"] as const,
  disponibilidad: (id: Guid, params: object) => [...nutricionistasKeys.all, "disponibilidad", id, params] as const,
};

/** El catalogo casi no cambia: se cachea largo para poblar los selectores. */
export function useNutricionistas(incluirInactivos = false) {
  return useQuery({
    queryKey: nutricionistasKeys.lista(incluirInactivos),
    queryFn: () => nutricionistasApi.listar(incluirInactivos),
    staleTime: 5 * 60_000,
  });
}

/** Solo quienes atienden pacientes: recepcion no recibe citas. */
export function useNutricionistasQueAtienden() {
  const consulta = useNutricionistas();
  return { ...consulta, data: consulta.data?.filter(atiendePacientes) };
}

export function useNutricionista(id: Guid | undefined) {
  return useQuery({
    queryKey: nutricionistasKeys.detalle(id ?? ""),
    queryFn: () => nutricionistasApi.obtener(id as Guid),
    enabled: Boolean(id),
  });
}

export function useCitasPendientesNutricionista(id: Guid | undefined, habilitado = true) {
  return useQuery({
    queryKey: nutricionistasKeys.pendientes(id ?? ""),
    queryFn: () => nutricionistasApi.citasPendientes(id as Guid),
    enabled: Boolean(id) && habilitado,
    staleTime: 15_000,
  });
}

function useInvalidarEquipo() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: nutricionistasKeys.all });
}

export function useCrearNutricionista() {
  const invalidar = useInvalidarEquipo();
  return useMutation({
    mutationFn: (dto: CrearNutricionistaDto) => nutricionistasApi.crear(dto),
    onSuccess: invalidar,
  });
}

/** Si la ficha editada es la propia, refresca tambien la sesion (nombre del menu). */
export function useActualizarNutricionista() {
  const invalidar = useInvalidarEquipo();
  const { usuario, actualizarUsuario } = useAuth();
  return useMutation({
    mutationFn: ({ id, dto }: { id: Guid; dto: ActualizarNutricionistaDto }) => nutricionistasApi.actualizar(id, dto),
    onSuccess: (actualizado) => {
      if (actualizado.id === usuario?.id) actualizarUsuario(actualizado);
      return invalidar();
    },
  });
}

export function useDesactivarNutricionista() {
  const invalidar = useInvalidarEquipo();
  return useMutation({ mutationFn: (id: Guid) => nutricionistasApi.desactivar(id), onSuccess: invalidar });
}

export function useReactivarNutricionista() {
  const invalidar = useInvalidarEquipo();
  return useMutation({ mutationFn: (id: Guid) => nutricionistasApi.reactivar(id), onSuccess: invalidar });
}

export function useRestablecerContrasena() {
  const invalidar = useInvalidarEquipo();
  return useMutation({
    mutationFn: ({ id, contrasena }: { id: Guid; contrasena: string }) =>
      nutricionistasApi.restablecerContrasena(id, contrasena),
    onSuccess: invalidar,
  });
}

/** Mueve las citas pendientes: tambien cambian la agenda, asi que se refresca. */
export function useReasignarCitas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, destinoId, rango }: { id: Guid; destinoId: Guid; rango?: { desde: string; hasta: string } }) =>
      nutricionistasApi.reasignarCitas(id, destinoId, rango),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutricionistasKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["citas"] });
    },
  });
}

/* ---------- Horario de atencion y ausencias ---------- */

/** Horario de la clinica y el efectivo de cada persona: la agenda lo usa al ofrecer horas. */
export function useHorarios() {
  return useQuery({
    queryKey: nutricionistasKeys.horarios(),
    queryFn: nutricionistasApi.horarios,
    staleTime: 5 * 60_000,
  });
}

/** Ausencias vigentes y futuras de todo el equipo (son pocas). */
export function useAusencias() {
  return useQuery({
    queryKey: nutricionistasKeys.ausencias(),
    queryFn: nutricionistasApi.ausencias,
    staleTime: 60_000,
  });
}

export function useActualizarHorarioClinica() {
  const invalidar = useInvalidarEquipo();
  return useMutation({
    mutationFn: (bloques: BloqueHorario[]) => nutricionistasApi.actualizarHorarioClinica(bloques),
    onSuccess: invalidar,
  });
}

export function useActualizarHorario() {
  const invalidar = useInvalidarEquipo();
  return useMutation({
    mutationFn: ({ id, dto }: { id: Guid; dto: ActualizarHorarioPersonaDto }) => nutricionistasApi.actualizarHorario(id, dto),
    onSuccess: invalidar,
  });
}

export function useCrearAusencia() {
  const invalidar = useInvalidarEquipo();
  return useMutation({
    mutationFn: ({ id, dto }: { id: Guid; dto: CrearAusenciaDto }) => nutricionistasApi.crearAusencia(id, dto),
    onSuccess: invalidar,
  });
}

export function useEliminarAusencia() {
  const invalidar = useInvalidarEquipo();
  return useMutation({
    mutationFn: ({ id, ausenciaId }: { id: Guid; ausenciaId: Guid }) => nutricionistasApi.eliminarAusencia(id, ausenciaId),
    onSuccess: invalidar,
  });
}

/**
 * Huecos libres de una persona (horario - ausencias - citas). Se refresca al
 * cambiar el equipo o el horario y, por las citas, a los 30 s.
 */
export function useDisponibilidad(
  id: Guid | undefined,
  params: { desde: string; hasta?: string; duracion?: number; paso?: number },
  habilitado = true,
) {
  return useQuery({
    queryKey: nutricionistasKeys.disponibilidad(id ?? "", params),
    queryFn: () => nutricionistasApi.disponibilidad(id as Guid, params),
    enabled: Boolean(id) && habilitado,
    staleTime: 30_000,
  });
}

/** Primer hueco de una respuesta de disponibilidad, con su fecha. */
export function primerHueco(dias: { fecha: string; huecos: { inicio: string; hora: string }[] }[] | undefined) {
  for (const dia of dias ?? []) {
    const hueco = dia.huecos[0];
    if (hueco) return { fecha: dia.fecha, ...hueco };
  }
  return null;
}
