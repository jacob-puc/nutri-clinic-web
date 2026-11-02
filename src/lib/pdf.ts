import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import { mensajeDeError } from "@/lib/api-error";

/**
 * Abre en otra pestaña un PDF protegido de la API (recibos, facturas, menus,
 * historial). No basta un <a href>: la API pide el token, asi que el archivo
 * se descarga con el cliente y se abre como blob.
 */
export async function abrirPdf(url: string): Promise<void> {
  /* La pestaña se abre ANTES de esperar al servidor: si se abre despues del
     await, el navegador la trata como popup no solicitado y la bloquea. */
  const pestana = window.open("", "_blank");
  try {
    const { data } = await apiClient.get<Blob>(url, { responseType: "blob" });
    const objeto = URL.createObjectURL(data);
    if (pestana) pestana.location.href = objeto;
    else window.location.assign(objeto);
    /* Se libera cuando la pestaña ya tuvo tiempo de cargarlo. */
    setTimeout(() => URL.revokeObjectURL(objeto), 60_000);
  } catch (error) {
    pestana?.close();
    throw error;
  }
}

/**
 * Para botones: ejecuta la apertura (p. ej. `() => menusApi.abrirMenuPdf(id)`)
 * y avisa con un toast si falla, en vez de dejar el click sin respuesta.
 */
export function abrirPdfConAviso(abrir: () => Promise<void>): void {
  abrir().catch((error) =>
    toast.error("No se pudo abrir el PDF", { description: mensajeDeError(error) }),
  );
}
