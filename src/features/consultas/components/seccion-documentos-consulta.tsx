import { useState } from "react";
import { FileText } from "lucide-react";

import { DialogoDocumento } from "@/features/consultas/components/dialogo-documento";
import { Button } from "@/components/ui/button";
import { Seccion } from "@/components/ficha/seccion";
import { EstadoVacio } from "@/components/states/estado-vacio";
import { formatearFechaCorta } from "@/lib/formatters";
import type { DocumentoPaciente, Guid, TipoDocumento } from "@/types/api";

const ETIQUETA_TIPO: Record<TipoDocumento, string> = {
  AnalisisLaboratorio: "Análisis de laboratorio",
  EstudioClinico: "Estudio clínico",
  RecetaMedica: "Receta médica",
  Otro: "Otro",
};

/** Documentos subidos durante esta consulta (análisis, estudios, recetas). */
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
  const [subiendo, setSubiendo] = useState(false);

  return (
    <>
      <Seccion
        titulo="Documentos"
        icono={FileText}
        meta={documentos.length > 0 ? `${documentos.length} en esta consulta` : undefined}
        acciones={
          !soloLectura ? (
            <Button size="sm" onClick={() => setSubiendo(true)}>
              <FileText className="size-4" />
              Subir documento
            </Button>
          ) : undefined
        }
      >
        {documentos.length === 0 ? (
          <EstadoVacio
            titulo="Sin documentos en esta consulta"
            descripcion="Adjunta análisis de laboratorio, estudios clínicos o recetas del paciente."
          >
            {!soloLectura && (
              <Button size="sm" onClick={() => setSubiendo(true)}>
                <FileText className="size-4" />
                Subir documento
              </Button>
            )}
          </EstadoVacio>
        ) : (
          <ul className="divide-border/60 divide-y">
            {documentos.map((documento) => (
              <li key={documento.id} className="flex items-start gap-3 py-3">
                <div className="bg-primary-soft text-primary-soft-foreground ring-primary/15 grid size-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset">
                  <FileText className="size-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate font-medium">
                    {documento.nombreDocumento}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {ETIQUETA_TIPO[documento.tipo]} · {formatearFechaCorta(documento.fechaSubida)}
                  </p>
                  {documento.observaciones && (
                    <p className="text-muted-foreground mt-1.5 text-sm">
                      {documento.observaciones}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <a href={documento.urlDocumento} target="_blank" rel="noreferrer">
                    Abrir
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <DialogoDocumento
        abierto={subiendo}
        onOpenChange={setSubiendo}
        pacienteId={pacienteId}
        consultaId={consultaId}
      />
    </>
  );
}
