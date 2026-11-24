import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { CLINICA } from "@/config/clinica";

const PIN = L.divIcon({
  className: "mapa-pin",
  html: '<span class="mapa-pin-halo"></span><span class="mapa-pin-gota"></span><img src="/favicon.svg" alt="">',
  iconSize: [52, 52],
  iconAnchor: [26, 52],
});

/**
 * Mapa real de OpenStreetMap con los colores de la marca (el tinte se
 * aplica a los mosaicos con CSS, ver `.mapa-marca` en index.css) y el pin
 * con el logo. No usa el servidor de la clinica ni claves de API. La rueda
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
