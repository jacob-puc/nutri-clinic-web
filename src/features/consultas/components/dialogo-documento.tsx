import { useState } from "react";
import { FileText, FileUp, Loader2 } from "lucide-react";

import { AlertaFormulario } from "@/components/ui/grupo-campos";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ZonaArchivos } from "@/features/consultas/components/zona-archivos";
import { ACCEPT_DOCUMENTO, ETIQUETA_TIPO_DOCUMENTO } from "@/features/consultas/lib/etiquetas-consulta";
import { useSubirDocumento } from "@/features/pacientes/hooks/use-mutaciones-paciente";
import { mensajeDeError } from "@/lib/api-error";
import type { Guid, TipoDocumento } from "@/types/api";

const TIPOS: TipoDocumento[] = ["AnalisisLaboratorio", "EstudioClinico", "RecetaMedica", "Otro"];

/**
 * Confirma la subida de un documento (análisis, estudio, receta) ligado a la
 * consulta. Igual que con las fotos, el archivo llega ya elegido; el tipo es
 * obligatorio en el backend.
 */
export function DialogoDocumento({
  archivo,
  onOpenChange,
  pacienteId,
  consultaId,
}: {
  archivo: File | null;
  onOpenChange: (abierto: boolean) => void;
  pacienteId: Guid;
  consultaId?: Guid;
}) {
  return (
    <Dialog open={archivo !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        {archivo && (
          <Contenido
            archivoInicial={archivo}
            pacienteId={pacienteId}
            consultaId={consultaId}
            onCerrar={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({
  archivoInicial,
  pacienteId,
  consultaId,
  onCerrar,
}: {
  archivoInicial: File;
  pacienteId: Guid;
  consultaId?: Guid;
  onCerrar: () => void;
}) {
  const subir = useSubirDocumento(pacienteId);
  const [archivo, setArchivo] = useState(archivoInicial);
  const [tipo, setTipo] = useState<TipoDocumento>("AnalisisLaboratorio");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);

  const alSubir = () => {
    setError(null);
    subir.mutate(
      { archivo, tipo, consultaId, observaciones: observaciones.trim() || null },
      {
        onSuccess: onCerrar,
        onError: (errorDeRed: unknown) => setError(mensajeDeError(errorDeRed)),
      },
    );
  };

  return (
    <>
      <DialogHeader icono={FileText}>
        <DialogTitle>Subir documento</DialogTitle>
        <DialogDescription>Análisis, estudios o recetas del paciente, ligados a esta consulta.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <ZonaArchivos
          compacta
          accept={ACCEPT_DOCUMENTO}
          icono={FileUp}
          titulo={archivo.name}
          detalle="Clic o arrastra otro archivo para cambiarlo"
          onArchivo={setArchivo}
        />

        <div className="space-y-2">
          <Label htmlFor="doc-tipo">Tipo de documento</Label>
          <Select value={tipo} onValueChange={(valor) => setTipo(valor as TipoDocumento)}>
            <SelectTrigger id="doc-tipo" className="bg-card h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS.map((valor) => (
                <SelectItem key={valor} value={valor}>
                  {ETIQUETA_TIPO_DOCUMENTO[valor]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="doc-observaciones">Observaciones</Label>
            <span className="text-muted-foreground-subtle text-xs font-normal">Opcional</span>
          </div>
          <Textarea
            id="doc-observaciones"
            placeholder="Qué muestra el análisis, fecha de la toma de muestra..."
            rows={2}
            value={observaciones}
            onChange={(evento) => setObservaciones(evento.target.value)}
            className="bg-card resize-none"
          />
        </div>

        {error && <AlertaFormulario>{error}</AlertaFormulario>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCerrar} disabled={subir.isPending}>
          Cancelar
        </Button>
        <Button onClick={alSubir} disabled={subir.isPending}>
          {subir.isPending && <Loader2 className="size-4 animate-spin" />}
          {subir.isPending ? "Subiendo..." : "Subir documento"}
        </Button>
      </DialogFooter>
    </>
  );
}
