import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { CLINICA } from "@/config/clinica";

/* Hoja del logo (lucide "Leaf"), para el pin. */
const HOJA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>';

const PIN = L.divIcon({
  className: "mapa-pin",
  html: `<span class="mapa-pin-halo"></span><span class="mapa-pin-gota"></span>${HOJA}`,
  iconSize: [52, 52],
  iconAnchor: [26, 52],
});

/**
 * Mapa real de OpenStreetMap con los colores de la marca (el tinte se
 * aplica a los mosaicos con CSS, ver `.mapa-marca` en index.css) y el pin
 * con la hoja. No usa el servidor de la clinica ni claves de API. La rueda
 * del mouse no hace zoom para no secuestrar el scroll de la pagina.
 */
export default function MapaClinica({ className }: { className?: string }) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contenedor.current) return;
    const { latitud, longitud } = CLINICA.coordenadas;
    const tactil = window.matchMedia("(pointer: coarse)").matches;

    const mapa = L.map(contenedor.current, {
      scrollWheelZoom: false,
      zoomControl: false,
      /* En el celular, arrastrar con un dedo mueve la pagina, no el mapa. */
      dragging: !tactil,
      attributionControl: true,
    });
    L.control.zoom({ position: "topright", zoomInTitle: "Acercar", zoomOutTitle: "Alejar" }).addTo(mapa);
    mapa.attributionControl.setPrefix(false);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(mapa);
    L.marker([latitud, longitud], { icon: PIN, title: CLINICA.nombre, keyboard: false }).addTo(mapa);

    /* El pin queda arriba a la derecha para que la tarjeta no lo tape. */
    const centrar = () => {
      const ancho = contenedor.current?.clientWidth ?? 0;
      mapa.setView([latitud, longitud], 16, { animate: false });
      if (ancho >= 640) mapa.panBy([-ancho * 0.18, 60], { animate: false });
      else mapa.panBy([0, 70], { animate: false });
    };
    centrar();
    const observador = new ResizeObserver(() => {
      mapa.invalidateSize();
      centrar();
    });
    observador.observe(contenedor.current);

    return () => {
      observador.disconnect();
      mapa.remove();
    };
  }, []);

  return (
    <div
      ref={contenedor}
      className={`mapa-marca ${className ?? ""}`}
      role="img"
      aria-label={`Mapa con la ubicación de ${CLINICA.nombre}: ${CLINICA.direccion}`}
    />
  );
}
