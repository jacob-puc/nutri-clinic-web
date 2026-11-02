import { useMemo } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cobrosApi } from "@/features/cobros/api/cobros-api";
import { useConsultas } from "@/features/consultas/hooks/use-consultas";
import type {
  ActualizarDatosFiscalesClinicaDto,
  CrearPagoDto,
  DatosFiscalesReceptor,
  FacturaFiltro,
  Guid,
  PagoFiltro,
} from "@/types/api";
import { hoyEnClinica, rangoDelDia, sumarDias } from "@/lib/zona-horaria";

export const cobrosKeys = {
  all: ["cobros"] as const,
  pagos: (filtro: PagoFiltro) => [...cobrosKeys.all, "pagos", filtro] as const,
  facturas: (filtro: FacturaFiltro) => [...cobrosKeys.all, "facturas", filtro] as const,
  clinica: () => [...cobrosKeys.all, "clinica"] as const,
};

export function usePagos(filtro: PagoFiltro = {}, opciones: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: cobrosKeys.pagos(filtro),
    queryFn: () => cobrosApi.listarPagos(filtro),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    enabled: opciones.enabled ?? true,
  });
}

/** El pago vigente de una consulta, o null si esta por cobrar. */
export function usePagoDeConsulta(consultaId: Guid | undefined) {
  const consulta = usePagos({ consultaId }, { enabled: Boolean(consultaId) });
  return { ...consulta, pago: consulta.data?.find((p) => p.estado === "Pagado") ?? null };
}

export function useFacturas(filtro: FacturaFiltro = {}, opciones: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: cobrosKeys.facturas(filtro),
    queryFn: () => cobrosApi.listarFacturas(filtro),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    enabled: opciones.enabled ?? true,
  });
}

/**
 * Datos fiscales con los que el paciente facturo la ultima vez: su factura
 * vigente mas reciente. Asi el formulario de factura ya llega lleno y solo
 * se corrige si cambio algo.
 */
export function useUltimosDatosFiscales(pacienteId: Guid | undefined) {
  const facturas = useFacturas({ pacienteId }, { enabled: Boolean(pacienteId) });
  /* La factura no trae el paciente; se confirma que sea de uno de SUS pagos.
     Asi, un backend sin el filtro pacienteId (que lo ignoraria y devolveria
     todas) nunca precarga los datos fiscales de otra persona. */
  const pagos = usePagos({ pacienteId }, { enabled: Boolean(pacienteId) });
  const pagosDelPaciente = new Set((pagos.data ?? []).map((p) => p.id));
  const ultima = facturas.data
    ?.filter((f) => f.estatus !== "Anulada" && pagosDelPaciente.has(f.pagoId))
    .sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision))[0];
  const datos: DatosFiscalesReceptor | null = ultima
    ? {
        tipoPersona: ultima.tipoPersona,
        rfc: ultima.rfc,
        razonSocial: ultima.nombreRazonSocial,
        regimenFiscal: ultima.regimenFiscal,
        usoCfdi: ultima.usoCfdi,
        codigoPostal: ultima.codigoPostal,
      }
    : null;
  return { cargando: (facturas.isPending || pagos.isPending) && Boolean(pacienteId), datos };
}

export function useDatosClinica() {
  return useQuery({
    queryKey: cobrosKeys.clinica(),
    queryFn: cobrosApi.obtenerDatosClinica,
    staleTime: 5 * 60_000,
  });
}

/* ---------- Mutaciones: todas refrescan el modulo completo ---------- */

function useInvalidarCobros() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: cobrosKeys.all });
}

export function useCrearPago() {
  const invalidar = useInvalidarCobros();
  return useMutation({ mutationFn: (dto: CrearPagoDto) => cobrosApi.crearPago(dto), onSuccess: invalidar });
}

export function useAnularPago() {
  const invalidar = useInvalidarCobros();
  return useMutation({
    mutationFn: ({ pagoId, motivo }: { pagoId: Guid; motivo: string | null }) => cobrosApi.anularPago(pagoId, motivo),
    onSuccess: invalidar,
  });
}

export function useEmitirFactura() {
  const invalidar = useInvalidarCobros();
  return useMutation({
    mutationFn: ({ pagoId, receptor }: { pagoId: Guid; receptor: DatosFiscalesReceptor }) =>
      cobrosApi.emitirFactura(pagoId, receptor),
    onSuccess: invalidar,
  });
}

export function useActualizarDatosClinica() {
  const invalidar = useInvalidarCobros();
  return useMutation({
    mutationFn: (dto: ActualizarDatosFiscalesClinicaDto) => cobrosApi.actualizarDatosClinica(dto),
    onSuccess: invalidar,
  });
}

/** Hasta donde se mira hacia atras: lo mas viejo ya no se cobra en mostrador. */
export const DIAS_POR_COBRAR = 60;

/**
 * Consultas cerradas sin pago vigente en los ultimos dias. La usan la
 * pestaña "Por cobrar" y el contador del menu lateral.
 */
export function usePorCobrar() {
  const desde = useMemo(() => rangoDelDia(sumarDias(hoyEnClinica(), -DIAS_POR_COBRAR)).desde, []);

  const consultas = useConsultas({ desde });
  const pagos = usePagos({ estado: "Pagado", fechaInicio: desde });

  const pendientes = useMemo(() => {
    const pagadas = new Set((pagos.data ?? []).map((p) => p.consultaId));
    return (consultas.data ?? [])
      .filter((c) => c.fechaFin !== null && !pagadas.has(c.id))
      .sort((a, b) => (b.fechaFin ?? "").localeCompare(a.fechaFin ?? ""));
  }, [consultas.data, pagos.data]);

  return {
    pendientes,
    cargando: consultas.isPending || pagos.isPending,
    error: consultas.error ?? pagos.error,
    reintentar: () => {
      void consultas.refetch();
      void pagos.refetch();
    },
  };
}
