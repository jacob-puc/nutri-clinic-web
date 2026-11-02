import { useState } from "react";
import { Camera, ImagePlus } from "lucide-react";

import { DialogoFoto } from "@/features/consultas/components/dialogo-foto";
import { EncabezadoBloque } from "@/features/consultas/components/encabezado-bloque";
import { ZonaArchivos } from "@/features/consultas/components/zona-archivos";
import { ETIQUETA_TIPO_FOTO } from "@/features/consultas/lib/etiquetas-consulta";
import { EliminarArchivo } from "@/features/pacientes/components/eliminar-archivo";
import type { FotoSeguimiento, Guid } from "@/types/api";

/**
 * Fotos de esta consulta. Sin tarjeta propia: la seccion es un titulo y una
 * zona donde soltar la foto; las tomas ya subidas aparecen al lado.
 */
export function SeccionFotosConsulta({
  pacienteId,
  consultaId,
  fotos,
  soloLectura,
}: {
  pacienteId: Guid;
  consultaId: Guid;
  fotos: FotoSeguimiento[];
  soloLectura: boolean;
}) {
  const [archivo, setArchivo] = useState<File | null>(null);

  if (soloLectura && fotos.length === 0) return null;

  return (
    <section aria-labelledby="titulo-fotos">
      <EncabezadoBloque id="titulo-fotos" icono={Camera} titulo="Fotos de seguimiento" conteo={fotos.length} />

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {fotos.map((foto) => (
          <figure key={foto.id} className="group relative">
            {!soloLectura && (
              <EliminarArchivo
                tipo="foto"
                pacienteId={pacienteId}
                id={foto.id}
                nombre={ETIQUETA_TIPO_FOTO[foto.tipo]}
                className="absolute top-2 right-2 z-10"
              />
            )}
            <a
              href={foto.urlFoto}
              target="_blank"
              rel="noreferrer"
              className="bg-muted block aspect-3/4 overflow-hidden rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
            >
              <img
                src={foto.urlFoto}
                alt={foto.notas ?? `Foto de seguimiento (${ETIQUETA_TIPO_FOTO[foto.tipo]})`}
                loading="lazy"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </a>
            <figcaption className="mt-1.5 px-0.5">
              <span className="text-foreground text-sm font-medium">{ETIQUETA_TIPO_FOTO[foto.tipo]}</span>
              {foto.notas && <p className="text-muted-foreground line-clamp-2 text-xs">{foto.notas}</p>}
            </figcaption>
          </figure>
        ))}

        {!soloLectura && (
          <ZonaArchivos
            accept="image/*"
            icono={ImagePlus}
            titulo={fotos.length === 0 ? "Arrastra una foto aquí" : "Agregar toma"}
            detalle={fotos.length === 0 ? "o haz clic para elegirla · frente, perfil o espalda" : "Arrastra o haz clic"}
            onArchivo={setArchivo}
            className={
              fotos.length === 0 ? "col-span-full" : "flex aspect-3/4 items-center [&>button]:h-full"
            }
          />
        )}
      </div>

      <DialogoFoto
        archivo={archivo}
        onOpenChange={(abierto) => !abierto && setArchivo(null)}
        pacienteId={pacienteId}
        consultaId={consultaId}
      />
    </section>
  );
}
