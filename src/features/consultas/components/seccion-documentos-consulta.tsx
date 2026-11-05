import { useState } from "react";
import { FileText, FileUp } from "lucide-react";

import { DialogoDocumento } from "@/features/consultas/components/dialogo-documento";
import { EncabezadoBloque } from "@/features/consultas/components/encabezado-bloque";
import { ZonaArchivos } from "@/features/consultas/components/zona-archivos";
import { ACCEPT_DOCUMENTO, ETIQUETA_TIPO_DOCUMENTO } from "@/features/consultas/lib/etiquetas-consulta";
import { EliminarArchivo } from "@/features/pacientes/components/eliminar-archivo";
import type { DocumentoPaciente, Guid } from "@/types/api";

/**
 * Documentos de la consulta, con la misma forma que las fotos: una
 * cuadricula de piezas del mismo tamaño y una zona donde soltar el archivo.
 * Se marca como opcional para que no se lea como un paso obligatorio.
 */
export function SeccionDocumentosConsulta({
  pacienteId,
  consultaId,
  documentos,
  soloLectura,
}: {
  pacienteId: Guid;
  consultaId: Guid;
  documentos: DocumentoPaciente[];
  soloLectura: boolean;
}) {
  const [archivo, setArchivo] = useState<File | null>(null);

  if (soloLectura && documentos.length === 0) return null;

  return (
    <section aria-labelledby="titulo-documentos">
      <EncabezadoBloque
        id="titulo-documentos"
        icono={FileText}
        titulo="Documentos"
        conteo={documentos.length}
        opcional={!soloLectura}
      />

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {documentos.map((documento) => (
          <div key={documento.id} className="group relative">
          {!soloLectura && (
            <EliminarArchivo
              tipo="documento"
              pacienteId={pacienteId}
              id={documento.id}
              nombre={documento.nombreDocumento}
              className="absolute top-2 right-2 z-10"
            />
          )}
          <a
            href={documento.urlDocumento}
            target="_blank"
            rel="noreferrer"
            className="hoja flex aspect-3/4 flex-col rounded-[1.25rem] p-3 outline-none transition-colors hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-primary/25"
          >
            <span className="bg-primary-soft text-primary-soft-foreground grid flex-1 place-items-center rounded-lg">
              <FileText className="size-8 transition-transform duration-300 group-hover:scale-110" aria-hidden />
            </span>
            <span className="mt-2 min-w-0">
              <span className="text-foreground block truncate text-sm font-medium">{documento.nombreDocumento}</span>
              <span className="text-muted-foreground block truncate text-xs">
                {ETIQUETA_TIPO_DOCUMENTO[documento.tipo]}
              </span>
            </span>
          </a>
          </div>
        ))}

        {!soloLectura && (
          <ZonaArchivos
            accept={ACCEPT_DOCUMENTO}
            icono={FileUp}
            titulo={documentos.length === 0 ? "Arrastra un documento aquí" : "Agregar documento"}
            detalle={
              documentos.length === 0
                ? "o haz clic para elegirlo · análisis, estudio o receta (PDF o imagen)"
                : "Arrastra o haz clic"
            }
            onArchivo={setArchivo}
            className={
              documentos.length === 0 ? "col-span-full" : "flex aspect-3/4 items-center [&>button]:h-full"
            }
          />
        )}
      </div>

      <DialogoDocumento
        archivo={archivo}
        onOpenChange={(abierto) => !abierto && setArchivo(null)}
        pacienteId={pacienteId}
        consultaId={consultaId}
      />
    </section>
  );
}
