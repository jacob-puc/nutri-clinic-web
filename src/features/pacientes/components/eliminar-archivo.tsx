import { useState } from "react";
import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEliminarArchivo } from "@/features/pacientes/hooks/use-mutaciones-paciente";
import { mensajeDeError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { Guid } from "@/types/api";

/**
 * Boton de borrar para una foto o un documento. Aparece al pasar el raton
 * por la pieza (el contenedor debe llevar la clase `group`) o al llegar con
 * el teclado; en pantallas tactiles, donde no hay hover, se ve siempre.
 *
 * El borrado es definitivo (el backend tambien quita el archivo del bucket),
 * por eso siempre pide confirmacion.
 */
export function EliminarArchivo({
  tipo,
  pacienteId,
  id,
  nombre,
  className,
}: {
  tipo: "foto" | "documento";
  pacienteId: Guid;
  id: Guid;
  /** Como se nombra en la confirmacion: "Frente · 12 oct", "Análisis.pdf". */
  nombre: string;
  className?: string;
}) {
  const eliminar = useEliminarArchivo(pacienteId);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sustantivo = tipo === "foto" ? "la foto" : "el documento";

  const cambiar = (abierto: boolean) => {
    if (!abierto) setError(null);
    setConfirmando(abierto);
  };

  return (
    <>
      <button
        type="button"
        aria-label={`Eliminar ${sustantivo} ${nombre}`}
        onClick={(e) => {
          /* La pieza puede ser un enlace (abrir la foto o el PDF). */
          e.preventDefault();
          e.stopPropagation();
          setConfirmando(true);
        }}
        className={cn(
          "bg-card/95 text-muted-foreground hover:text-destructive hover:border-destructive/40 grid size-8 cursor-pointer place-items-center rounded-lg border shadow-sm backdrop-blur-sm transition-[opacity,color,border-color] outline-none focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-destructive/25",
          "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100",
          className,
        )}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>

      <AlertDialog open={confirmando} onOpenChange={cambiar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {sustantivo}?</AlertDialogTitle>
            <AlertDialogDescription>
              «{nombre}» se borra del expediente del paciente junto con el archivo. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={eliminar.isPending}
              className="bg-destructive border-destructive/80 hover:bg-destructive/90 text-white"
              onClick={(e) => {
                e.preventDefault();
                setError(null);
                eliminar.mutate(
                  { tipo, id },
                  {
                    onSuccess: () => cambiar(false),
                    onError: (fallo) => setError(mensajeDeError(fallo)),
                  },
                );
              }}
            >
              {eliminar.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
