/*
 * Ultima vista de cada seccion (pestaña, fechas y filtros), para que "volver"
 * desde un detalle regrese a donde estaba y no a la vista inicial. Vive en
 * sessionStorage: dura lo que la pestaña del navegador.
 */

const PREFIJO = "nc_volver:";

/** Solo las secciones del menu: /consultas, /pacientes... (un segmento). */
const SECCION = /^\/[a-z-]+$/;

export function recordarVista(pathname: string, search: string) {
  if (!SECCION.test(pathname)) return;
  try {
    sessionStorage.setItem(PREFIJO + pathname, pathname + search);
  } catch {
    /* Sin almacenamiento, volver lleva a la vista inicial. */
  }
}

/** La ultima vista recordada de la seccion, o la seccion tal cual. */
export function rutaVolver(href: string): string {
  if (!SECCION.test(href)) return href;
  try {
    return sessionStorage.getItem(PREFIJO + href) ?? href;
  } catch {
    return href;
  }
}
