import { useState } from "react";
import { Camera } from "lucide-react";

import { DialogoFoto } from "@/features/consultas/components/dialogo-foto";
import { Button } from "@/components/ui/button";
import { Seccion } from "@/components/ficha/seccion";
import { EstadoVacio } from "@/components/states/estado-vacio";
import { formatearFechaCorta } from "@/lib/formatters";
import type { FotoSeguimiento, Guid, TipoFoto } from "@/types/api";

const ETIQUETA_TIPO: Record<TipoFoto, string> = {
  Frente: "Frente",
  Perfil: "Perfil",
  Espalda: "Espalda",
  Otro: "Otra toma",
};

/** Fotos subidas durante esta consulta, con la copia impresa del expediente. */
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
  const [subiendo, setSubiendo] = useState(false);

  return (
    <>
      <Seccion
        titulo="Fotos de seguimiento"
        icono={Camera}
        meta={fotos.length > 0 ? `${fotos.length} en esta consulta` : undefined}
        acciones={
          !soloLectura ? (
            <Button size="sm" onClick={() => setSubiendo(true)}>
              <Camera className="size-4" />
              Subir foto
            </Button>
          ) : undefined
        }
      >
        {fotos.length === 0 ? (
          <EstadoVacio
            titulo="Sin fotos en esta consulta"
            descripcion="Sube las tomas de frente, perfil o espalda para comparar el avance."
          >
            {!soloLectura && (
              <Button size="sm" onClick={() => setSubiendo(true)}>
                <Camera className="size-4" />
                Subir foto
              </Button>
            )}
          </EstadoVacio>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fotos.map((foto) => (
              <figure key={foto.id} className="hoja rounded-lg p-2 pb-3">
                <div className="bg-muted aspect-4/3 w-full overflow-hidden rounded-md">
                  <img
                    src={foto.urlFoto}
                    alt={foto.notas ?? `Foto de seguimiento (${ETIQUETA_TIPO[foto.tipo]})`}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </div>
                <figcaption className="px-1.5 pt-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-foreground text-sm font-medium">
                      {ETIQUETA_TIPO[foto.tipo]}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {formatearFechaCorta(foto.fechaSubida)}
                    </span>
                  </div>
                  {foto.notas && (
                    <p className="text-muted-foreground mt-1 text-sm">{foto.notas}</p>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Seccion>

      <DialogoFoto
        abierto={subiendo}
        onOpenChange={setSubiendo}
        pacienteId={pacienteId}
        consultaId={consultaId}
      />
    </>
  );
}
