import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarX, Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertaFormulario } from "@/components/ui/grupo-campos";
import { Sugerencias } from "@/components/ui/sugerencias";
import { Textarea } from "@/components/ui/textarea";
import { useCambiarEstadoCita } from "@/features/citas/hooks/use-mutaciones-cita";
import { mensajeDeError } from "@/lib/api-error";
import type { Guid } from "@/types/api";

/** Replica `CambiarEstadoCitaValidator`: cancelar siempre pide motivo. */
const esquema = z.object({
  motivo: z.string().min(1, "Debes indicar el motivo de la cancelación").max(500, "El motivo no puede tener más de 500 caracteres"),
});

type FormularioValues = z.infer<typeof esquema>;

const MOTIVOS_CANCELACION = [
  "El paciente pidió reprogramar",
  "Enfermedad del paciente",
  "Emergencia del paciente",
  "Ausencia del nutricionista",
];

export function DialogoCancelarCita({
  abierto,
  onOpenChange,
  citaId,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  citaId: Guid;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icono={CalendarX} tono="destructivo">
          <DialogTitle>Cancelar cita</DialogTitle>
          <DialogDescription>
            El motivo queda registrado en el expediente de la cita.
          </DialogDescription>
        </DialogHeader>

        <FormularioCancelar
          key={abierto ? "abierta" : "cerrada"}
          citaId={citaId}
          onCerrar={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function FormularioCancelar({
  citaId,
  onCerrar,
}: {
  citaId: Guid;
  onCerrar: () => void;
}) {
  const cancelar = useCambiarEstadoCita(citaId);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const form = useForm<FormularioValues>({
    resolver: zodResolver(esquema),
    mode: "onBlur",
    defaultValues: { motivo: "" },
  });

  const alEnviar = form.handleSubmit((values) => {
    setErrorGeneral(null);

    cancelar.mutate(
      { estado: "Cancelada", motivo: values.motivo.trim() },
      {
        onSuccess: onCerrar,
        onError: (error: unknown) => setErrorGeneral(mensajeDeError(error)),
      },
    );
  });

  return (
    <Form {...form}>
      <form onSubmit={alEnviar} noValidate className="space-y-4">
        <FormField
          control={form.control}
          name="motivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo de la cancelación</FormLabel>
              <Sugerencias
                etiqueta="Motivos frecuentes"
                opciones={MOTIVOS_CANCELACION}
                valor={field.value}
                onElegir={(motivo) =>
                  form.setValue("motivo", motivo, { shouldDirty: true, shouldValidate: true })
                }
              />
              <FormControl>
                <Textarea
                  placeholder="Describe por qué no se realizará la cita"
                  rows={3}
                  className="bg-card resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {errorGeneral && <AlertaFormulario>{errorGeneral}</AlertaFormulario>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar} disabled={cancelar.isPending}>
            Volver
          </Button>
          <Button type="submit" disabled={cancelar.isPending} variant="destructive">
            {cancelar.isPending && <Loader2 className="size-4 animate-spin" />}
            Cancelar cita
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
