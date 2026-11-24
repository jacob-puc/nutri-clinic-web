/**
 * Datos publicos de la clinica para el sitio (seccion "Contacto" y mapa).
 * Son fijos a proposito: el sitio los muestra al instante, aunque el
 * servidor este dormido. Si la clinica cambia de lugar o de telefono,
 * solo se edita este archivo.
 *
 * Coordenadas: en Google Maps, clic derecho sobre el lugar exacto y el
 * primer renglon del menu son "latitud, longitud" (se copian con un clic).
 */
export const CLINICA = {
  nombre: "Nourish Clinic",
  direccion: "Av. Constitución 1000, Centro, Monterrey, N.L.",
  telefono: "8180000000",
  correo: "contacto@nutriclinica.cl",
  coordenadas: { latitud: 25.66505, longitud: -100.3093 },
} as const;

/** Abre la ruta en Google Maps (en el celular, en la app de mapas). */
export const URL_COMO_LLEGAR = `https://www.google.com/maps/dir/?api=1&destination=${CLINICA.coordenadas.latitud},${CLINICA.coordenadas.longitud}`;
