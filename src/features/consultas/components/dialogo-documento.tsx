import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";

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
import { SubirArchivo } from "@/features/consultas/components/subir-archivo";
import { useSubirDocumento } from "@/features/pacientes/hooks/use-mutaciones-paciente";
import { mensajeDeError } from "@/lib/api-error";
import type { Guid, TipoDocumento } from "@/types/api";

const ETIQUETA_TIPO: Record<TipoDocumento, string> = {
  AnalisisLaboratorio: "Análisis de laboratorio",
  EstudioClinico: "Estudio clínico",
  RecetaMedica: "Receta médica",
  Otro: "Otro",
};

const TIPOS: TipoDocumento[] = [
  "AnalisisLaboratorio",
  "EstudioClinico",
  "RecetaMedica",
  "Otro",
];

/**
 * Sube un documento (análisis, estudio, receta) al expediente, enlazado a la
 * consulta en curso. El tipo es obligatorio en el backend; el archivo viaja
 * por multipart (ver `pacientesApi.subirDocumento`).
 */
export function DialogoDocumento({
  abierto,
  onOpenChange,
  pacienteId,
  consultaId,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  pacienteId: Guid;
  consultaId?: Guid;
}) {
  const subir = useSubirDocumento(pacienteId);
  const [tipo, setTipo] = useState<TipoDocumento>("AnalisisLaboratorio");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cerrar = (siguiente: boolean) => {
    if (subir.isPending) return;
    if (!siguiente) {
      setError(null);
      setObservaciones("");
    }
    onOpenChange(siguiente);
  };

  const alSubir = (archivo: File) => {
    setError(null);
    subir.mutate(
      { archivo, tipo, consultaId, observaciones: observaciones.trim() || null },
      {
        onSuccess: () => cerrar(false),
        onError: (errorDeRed: unknown) => setError(mensajeDeError(errorDeRed)),
      },
    );
  };

  return (
    <Dialog open={abierto} onOpenChange={cerrar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icono={FileText}>
          <DialogTitle>Subir documento</DialogTitle>
          <DialogDescription>
            Análisis, estudios o recetas del paciente, ligados a esta consulta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-tipo">Tipo de documento</Label>
            <Select value={tipo} onValueChange={(valor) => setTipo(valor as TipoDocumento)}>
              <SelectTrigger id="doc-tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((valor) => (
                  <SelectItem key={valor} value={valor}>
                    {ETIQUETA_TIPO[valor]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SubirArchivo
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            etiqueta="Elegir archivo"
            subiendo={subir.isPending}
            onArchivo={alSubir}
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="doc-observaciones">Observaciones</Label>
              <span className="text-muted-foreground-subtle text-xs font-normal">
                Opcional
              </span>
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
          <Button variant="outline" onClick={() => cerrar(false)} disabled={subir.isPending}>
            {subir.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
