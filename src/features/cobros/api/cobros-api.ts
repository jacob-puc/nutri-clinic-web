import { apiClient } from "@/lib/api-client";
import { esApiError } from "@/lib/api-error";
import { traerTodasLasHojas } from "@/lib/paginacion";
import { abrirPdf } from "@/lib/pdf";
import type {
  ActualizarDatosFiscalesClinicaDto,
  CrearPagoDto,
  DatosFiscalesClinica,
  DatosFiscalesReceptor,
  Factura,
  FacturaFiltro,
  Guid,
  Pago,
  PagoFiltro,
} from "@/types/api";

/**
 * Cobros y facturacion. Los listados vienen paginados; se recorren las hojas
 * para trabajar con el conjunto del rango pedido (dia, semana, mes).
 */
export const cobrosApi = {
  listarPagos: (filtro: PagoFiltro = {}): Promise<Pago[]> =>
    traerTodasLasHojas<Pago>("/api/pagos", { ...filtro }),

  /** 400 si la consulta sigue abierta; 409 si ya tiene un pago vigente. */
  crearPago: async (dto: CrearPagoDto): Promise<Pago> => {
    const { data } = await apiClient.post<Pago>("/api/pagos", dto);
    return data;
  },

  /** 409 si el pago ya esta facturado. */
  anularPago: async (pagoId: Guid, motivo: string | null): Promise<Pago> => {
    const { data } = await apiClient.post<Pago>(`/api/pagos/${pagoId}/anular`, { motivo });
    return data;
  },

  abrirComprobante: (pagoId: Guid) => abrirPdf(`/api/pagos/${pagoId}/comprobante`),

  emitirFactura: async (pagoId: Guid, receptor: DatosFiscalesReceptor): Promise<Factura> => {
    const { data } = await apiClient.post<Factura>(`/api/pagos/${pagoId}/factura`, { pagoId, ...receptor });
    return data;
  },

  listarFacturas: (filtro: FacturaFiltro = {}): Promise<Factura[]> =>
    traerTodasLasHojas<Factura>("/api/facturas", { ...filtro }),

  abrirFacturaPdf: (facturaId: Guid) => abrirPdf(`/api/facturas/${facturaId}/pdf`),

  /** 404 mientras la clinica no tenga datos fiscales: se devuelve null. */
  obtenerDatosClinica: async (): Promise<DatosFiscalesClinica | null> => {
    try {
      const { data } = await apiClient.get<DatosFiscalesClinica>("/api/configuracion/datos-fiscales");
      return data;
    } catch (error) {
      if (esApiError(error) && error.status === 404) return null;
      throw error;
    }
  },

  actualizarDatosClinica: async (dto: ActualizarDatosFiscalesClinicaDto): Promise<DatosFiscalesClinica> => {
    const { data } = await apiClient.put<DatosFiscalesClinica>("/api/configuracion/datos-fiscales", dto);
    return data;
  },
};
