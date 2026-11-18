import { apiClient } from "@/lib/api-client";
import type { Guid } from "@/types/api";

/** Documento que se puede enviar por correo al paciente. */
export type TipoDocumento = "plan" | "historial" | "comprobante" | "factura";

export interface EnviarDocumentoDto {
  /** Nota opcional de quien envia; va dentro del correo. */
  mensaje?: string | null;
  /** Solo comprobante y factura: otro destinatario (p. ej. una empresa). */
  para?: string | null;
}

export interface EnvioDocumento {
  id: Guid;
  tipo: string;
  para: string;
  /** Pendiente | Enviado | Fallido | Descartado */
  estado: "Pendiente" | "Enviado" | "Fallido" | "Descartado";
  fechaCreacion: string;
  fechaEnvio: string | null;
  error: string | null;
  enviadoPor: string | null;
}

const RUTA: Record<TipoDocumento, (id: Guid) => string> = {
  plan: (id) => `/api/menu-asignados/${id}/enviar`,
  historial: (id) => `/api/pacientes/${id}/historial-clinico/enviar`,
  comprobante: (id) => `/api/pagos/${id}/enviar`,
  factura: (id) => `/api/facturas/${id}/enviar`,
};

/**
 * Envio manual de documentos. El backend genera el PDF en ese momento y lo
 * deja en la cola de correos; el envio real ocurre segundos despues.
 */
export const enviosApi = {
  enviar: async (tipo: TipoDocumento, referenciaId: Guid, dto: EnviarDocumentoDto): Promise<EnvioDocumento> => {
    const { data } = await apiClient.post<EnvioDocumento>(RUTA[tipo](referenciaId), dto);
    return data;
  },

  /** Ultimos envios del documento (plan, paciente, pago o factura). */
  listar: async (referenciaId: Guid): Promise<EnvioDocumento[]> => {
    const { data } = await apiClient.get<EnvioDocumento[]>("/api/envios", { params: { referenciaId } });
    return data;
  },
};
