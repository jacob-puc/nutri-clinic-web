import { useEffect, useState } from "react";
import { Camera, ImageUp, Loader2 } from "lucide-react";

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
import { Segmentado } from "@/components/ui/segmentado";
import { Textarea } from "@/components/ui/textarea";
import { ZonaArchivos } from "@/features/consultas/components/zona-archivos";
import { useSubirFoto } from "@/features/pacientes/hooks/use-mutaciones-paciente";
import { mensajeDeError } from "@/lib/api-error";
import type { Guid, TipoFoto } from "@/types/api";

const TIPOS: { valor: TipoFoto; etiqueta: string }[] = [
  { valor: "Frente", etiqueta: "Frente" },
  { valor: "Perfil", etiqueta: "Perfil" },
  { valor: "Espalda", etiqueta: "Espalda" },
  { valor: "Otro", etiqueta: "Otra" },
];

/**
 * Confirma la subida de una foto de seguimiento. El archivo llega ya elegido
 * (soltado o seleccionado en la seccion); aqui se ve la vista previa, se
 * indica el tipo de toma, que el backend exige, y se sube.
 */
export function DialogoFoto({
  archivo,
  onOpenChange,
  pacienteId,
  consultaId,
}: {
  /** Con archivo el dialogo esta abierto. */
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
  const subir = useSubirFoto(pacienteId);
  const [archivo, setArchivo] = useState(archivoInicial);
  const [tipo, setTipo] = useState<TipoFoto>("Frente");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);

  const alSubir = () => {
    setError(null);
    subir.mutate(
      { archivo, tipo, consultaId, notas: notas.trim() || null },
      {
        onSuccess: onCerrar,
        onError: (errorDeRed: unknown) => setError(mensajeDeError(errorDeRed)),
      },
    );
  };

  return (
    <>
      <DialogHeader icono={Camera}>
        <DialogTitle>Subir foto de seguimiento</DialogTitle>
        <DialogDescription>Queda en el expediente del paciente, ligada a esta consulta.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <VistaPrevia archivo={archivo} />

        <ZonaArchivos
          compacta
          accept="image/*"
          icono={ImageUp}
          titulo="Cambiar foto"
          detalle={archivo.name}
          onArchivo={setArchivo}
        />

        <div className="space-y-2">
          <Label>Tipo de toma</Label>
          <Segmentado aria-label="Tipo de toma" value={tipo} onChange={setTipo} opciones={TIPOS} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="foto-notas">Notas</Label>
            <span className="text-muted-foreground-subtle text-xs font-normal">Opcional</span>
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
        <Button variant="outline" onClick={onCerrar} disabled={subir.isPending}>
          Cancelar
        </Button>
        <Button onClick={alSubir} disabled={subir.isPending}>
          {subir.isPending && <Loader2 className="size-4 animate-spin" />}
          {subir.isPending ? "Subiendo..." : "Subir foto"}
        </Button>
      </DialogFooter>
    </>
  );
}

/* Se lee como data URL y no con createObjectURL: no hay URL que liberar, y
   el doble montaje de StrictMode no la revoca a medio pintar. */
function VistaPrevia({ archivo }: { archivo: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const lector = new FileReader();
    lector.onload = () => setUrl(typeof lector.result === "string" ? lector.result : null);
    lector.readAsDataURL(archivo);
    return () => lector.abort();
  }, [archivo]);

  return (
    <div className="bg-muted aspect-4/3 w-full overflow-hidden rounded-lg">
      {url && <img src={url} alt="Vista previa de la foto" className="size-full object-contain" />}
    </div>
  );
}
