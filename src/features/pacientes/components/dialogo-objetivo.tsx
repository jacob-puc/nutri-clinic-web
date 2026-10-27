import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Target } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { InputUnidad } from "@/components/ui/input-unidad";
import { Sugerencias } from "@/components/ui/sugerencias";
import { campoNumero } from "@/lib/campos-formulario";
import { mensajeDeError } from "@/lib/api-error";
import type { ActualizarObjetivoPacienteDto, Paciente } from "@/types/api";

/** El campo acepta cualquier texto; estas solo evitan teclear lo de siempre. */
const TITULOS_SUGERIDOS = [
  "Recomposición total",
  "Pérdida de peso",
  "Ganancia de masa muscular",
  "Mantenimiento de peso",
  "Salud metabólica",
  "Preparación para competencia",
];

const schema = z.object({
  tituloObjetivo: z
    .string()
    .trim()
    .max(80, "El título no puede tener más de 80 caracteres"),
  pesoObjetivo: z
    .number()
    .positive("El peso objetivo debe ser mayor a 0 kg.")
    .lt(400, "Ingresa un peso objetivo válido.")
    .optional(),
});

type Valores = z.infer<typeof schema>;

export function DialogoObjetivo({
  abierto,
  onOpenChange,
  paciente,
  onGuardar,
  guardando,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  paciente: Paciente;
  onGuardar: (datos: ActualizarObjetivoPacienteDto) => Promise<unknown>;
  guardando: boolean;
}) {
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    values: {
      tituloObjetivo: paciente.tituloObjetivo ?? "",
      pesoObjetivo: paciente.pesoObjetivo ?? undefined,
    },
  });

  const tituloVigente = useWatch({ control: form.control, name: "tituloObjetivo" });

  const enviar = form.handleSubmit(async (values) => {
    setErrorGeneral(null);
    try {
      await onGuardar({
        tituloObjetivo:
          values.tituloObjetivo.trim() === ""
            ? null
            : values.tituloObjetivo.trim(),
        pesoObjetivo: values.pesoObjetivo ?? null,
      });
      toast.success("Objetivo actualizado");
      onOpenChange(false);
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    }
  });

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader icono={Target}>
          <DialogTitle>Objetivo del paciente</DialogTitle>
          <DialogDescription>
            Se define en consulta, con el paciente presente, cuando ya hay una
            evaluación que lo sustente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={enviar} noValidate className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <FormField
                control={form.control}
                name="tituloObjetivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel opcional>Título del objetivo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Recomposición total"
                        maxLength={80}
                        className="bg-card h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pesoObjetivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel opcional>Peso a llegar</FormLabel>
                    <FormControl>
                      <InputUnidad
                        unidad="kg"
                        inputMode="decimal"
                        step="0.1"
                        placeholder="72"
                        {...campoNumero(field)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Sugerencias
              etiqueta="Objetivos frecuentes"
              opciones={TITULOS_SUGERIDOS}
              valor={tituloVigente}
              onElegir={(titulo) =>
                form.setValue("tituloObjetivo", titulo, { shouldDirty: true, shouldValidate: true })
              }
            />

            {errorGeneral && <AlertaFormulario>{errorGeneral}</AlertaFormulario>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando && <Loader2 className="size-4 animate-spin" />}
                Guardar objetivo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
