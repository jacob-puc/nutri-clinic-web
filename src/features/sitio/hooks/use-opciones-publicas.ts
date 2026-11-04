import { useQuery } from "@tanstack/react-query";

import { reservasApi } from "@/features/reservas/api/reservas-api";

/** Clinica, equipo y horario publicos; inicio y reservacion comparten la cache. */
export function useOpcionesPublicas() {
  return useQuery({ queryKey: ["reserva", "opciones"], queryFn: reservasApi.opciones, staleTime: 5 * 60_000 });
}

/** "8180000000" -> "81 8000 0000"; lo que no tenga 10 digitos se deja igual. */
export function formatearTelefono(telefono: string) {
  const digitos = telefono.replace(/\D/g, "");
  return digitos.length === 10 ? `${digitos.slice(0, 2)} ${digitos.slice(2, 6)} ${digitos.slice(6)}` : telefono;
}
