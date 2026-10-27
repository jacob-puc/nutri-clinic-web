import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { AlertaFormulario } from "@/components/ui/grupo-campos";
import { Button } from "@/components/ui/button";
import { Seccion } from "@/components/ficha/seccion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useCerrarConsulta } from "@/features/consultas/hooks/use-mutaciones-consulta";
import { mensajeDeError } from "@/lib/api-error";
import type { Guid } from "@/types/api";

/**
 * Cierre de la consulta. Fija `fechaFin` y guarda las notas de cierre; el
 * backend, en el mismo paso, pone la cita en `Completada`.
 *
 * El backend todavía no expone un `PUT` de consulta, así que las notas solo se
 * escriben al crear y al cerrar: no hay guardado intermedio. Por eso el texto
 * se conserva aquí y solo se envía al cerrar.
 */
export function SeccionCierre({
  consultaId,
  notasIniciales,
}: {
  consultaId: Guid;
  notasIniciales: string | null;
}) {
  const cerrar = useCerrarConsulta(consultaId);
  const [confirmando, setConfirmando] = useState(false);
  /* El componente solo se monta cuando la consulta ya cargó, así que las
     notas iniciales son estables y no hace falta sincronizarlas en un effect. */
  const [notas, setNotas] = useState(notasIniciales ?? "");
  const [error, setError] = useState<string | null>(null);

  const alConfirmar = () => {
    setError(null);
    cerrar.mutate(
      { notasClinicas: notas.trim() || null },
      {
        onSuccess: () => setConfirmando(false),
        onError: (errorDeRed: unknown) => {
          setError(mensajeDeError(errorDeRed));
          setConfirmando(false);
        },
      },
    );
  };

  return (
    <>
      <Seccion
        titulo="Cierre de la consulta"
        icono={CheckCircle2}
        acciones={
          <Button size="sm" onClick={() => setConfirmando(true)} disabled={cerrar.isPending}>
            {cerrar.isPending && <Loader2 className="size-4 animate-spin" />}
            Cerrar consulta
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="notas-cierre">Notas clínicas de cierre</Label>
            <Textarea
              id="notas-cierre"
              placeholder="Resumen de la atención, evolución, indicaciones y plan para la próxima visita..."
              rows={5}
              value={notas}
              onChange={(evento) => setNotas(evento.target.value)}
              className="bg-card resize-y"
            />
            <p className="text-muted-foreground-subtle text-xs">
              Al cerrar, la consulta queda registrada y la cita pasa a completada.
            </p>
          </div>

          {error && <AlertaFormulario>{error}</AlertaFormulario>}
        </div>
      </Seccion>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar la consulta</AlertDialogTitle>
            <AlertDialogDescription>
              Se fija la fecha de cierre y la cita asociada pasa a{" "}
              <span className="text-foreground font-medium">Completada</span>. Esta acción
              no se puede deshacer desde la app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cerrar.isPending}>Volver</AlertDialogCancel>
            <AlertDialogAction disabled={cerrar.isPending} onClick={(e) => {
              e.preventDefault();
              alConfirmar();
            }}>
              {cerrar.isPending && <Loader2 className="size-4 animate-spin" />}
              Cerrar consulta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
