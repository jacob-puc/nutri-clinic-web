import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { campoNumero } from "@/lib/campos-formulario";
import { mensajeDeError } from "@/lib/api-error";
import type { ActualizarObjetivoPacienteDto, Paciente } from "@/types/api";

/** El campo acepta cualquier texto; estas solo evitan teclear lo de siempre. */
const TITULOS_SUGERIDOS = [
  "Recomposicion total",
  "Perdida de peso",
  "Ganancia de masa muscular",
  "Mantenimiento de peso",
  "Salud metabolica",
  "Preparacion para competencia",
];

const schema = z.object({
  tituloObjetivo: z
    .string()
    .trim()
    .max(80, "El titulo no puede tener mas de 80 caracteres"),
  pesoObjetivo: z
    .number()
    .positive("El peso objetivo debe ser mayor a 0 kg.")
    .lt(400, "Ingresa un peso objetivo valido.")
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
        <DialogHeader>
          <DialogTitle>Objetivo del paciente</DialogTitle>
          <DialogDescription>
            Se define en consulta, con el paciente presente, cuando ya hay una
            evaluacion que lo sustente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={enviar} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tituloObjetivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titulo del objetivo</FormLabel>
                    <FormControl>
                      <Input
                        list="titulos-objetivo"
                        placeholder="Recomposicion total"
                        maxLength={80}
                        {...field}
                      />
                    </FormControl>
                    <datalist id="titulos-objetivo">
                      {TITULOS_SUGERIDOS.map((titulo) => (
                        <option key={titulo} value={titulo} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pesoObjetivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso a llegar (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        placeholder="Ej. 72"
                        {...campoNumero(field)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {errorGeneral && (
              <p
                role="alert"
                className="border-destructive/40 bg-destructive/8 text-destructive rounded-lg border px-3 py-2 text-sm"
              >
                {errorGeneral}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
