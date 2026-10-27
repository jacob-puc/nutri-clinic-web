import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";

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
import { useSubirFoto } from "@/features/pacientes/hooks/use-mutaciones-paciente";
import { mensajeDeError } from "@/lib/api-error";
import type { Guid, TipoFoto } from "@/types/api";

const TIPOS: TipoFoto[] = ["Frente", "Perfil", "Espalda", "Otro"];

/**
 * Sube una foto de seguimiento al expediente, enlazada a la consulta en curso.
 * El tipo es obligatorio en el backend, así que se elige aquí; el archivo se
 * manda por multipart (ver `pacientesApi.subirFoto`).
 */
export function DialogoFoto({
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
  const subir = useSubirFoto(pacienteId);
  const [tipo, setTipo] = useState<TipoFoto>("Frente");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cerrar = (siguiente: boolean) => {
    if (subir.isPending) return;
    if (!siguiente) {
      setError(null);
      setNotas("");
    }
    onOpenChange(siguiente);
  };

  const alSubir = (archivo: File) => {
    setError(null);
    subir.mutate(
      { archivo, tipo, consultaId, notas: notas.trim() || null },
      {
        onSuccess: () => cerrar(false),
        onError: (errorDeRed: unknown) => setError(mensajeDeError(errorDeRed)),
      },
    );
  };

  return (
    <Dialog open={abierto} onOpenChange={cerrar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icono={Camera}>
          <DialogTitle>Subir foto de seguimiento</DialogTitle>
          <DialogDescription>
            Se guarda en el expediente del paciente y queda ligada a esta consulta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="foto-tipo">Tipo de toma</Label>
            <Select value={tipo} onValueChange={(valor) => setTipo(valor as TipoFoto)}>
              <SelectTrigger id="foto-tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((valor) => (
                  <SelectItem key={valor} value={valor}>
                    {valor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SubirArchivo
            accept="image/*"
            etiqueta="Elegir foto"
            subiendo={subir.isPending}
            onArchivo={alSubir}
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="foto-notas">Notas</Label>
              <span className="text-muted-foreground-subtle text-xs font-normal">
                Opcional
              </span>
            </div>
            <Textarea
              id="foto-notas"
              placeholder="Ángulo, iluminación, contexto de la toma..."
              rows={2}
              value={notas}
              onChange={(evento) => setNotas(evento.target.value)}
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
