import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRegistrarMedida } from "@/features/pacientes/hooks/use-mutaciones-paciente";
import { erroresPorCampo } from "@/features/pacientes/lib/errores-formulario";
import { mensajeDeError } from "@/lib/api-error";
import { campoNumero } from "@/lib/campos-formulario";
import { calcularImc, categoriaImc } from "@/lib/formatters";
import type { CrearMedidaDto, Guid } from "@/types/api";

/** Replica `CrearMedidaValidator`; el backend sigue siendo la autoridad. */
const esquema = z.object({
  peso: z
    .number({ required_error: "El peso es requerido" })
    .positive("El peso debe ser mayor a 0 kg.")
    .max(400, "Ingresa un peso valido."),
  estatura: z
    .number({ required_error: "La estatura es requerida" })
    .positive("La estatura debe ser mayor a 0 cm.")
    .max(300, "Ingresa una estatura valida en centimetros."),
  porcentajeGrasa: z
    .number()
    .min(0, "El porcentaje de grasa debe estar entre 0% y 100%.")
    .max(100, "El porcentaje de grasa debe estar entre 0% y 100%.")
    .optional(),
  porcentajeMasaMuscular: z
    .number()
    .min(0, "El porcentaje de masa muscular debe estar entre 0% y 100%.")
    .max(100, "El porcentaje de masa muscular debe estar entre 0% y 100%.")
    .optional(),
  medidaCintura: z
    .number()
    .min(1, "La medida de cintura debe estar entre 1 cm y 300 cm.")
    .max(300, "La medida de cintura debe estar entre 1 cm y 300 cm.")
    .optional(),
  medidaCadera: z
    .number()
    .min(1, "La medida de cadera debe estar entre 1 cm y 300 cm.")
    .max(300, "La medida de cadera debe estar entre 1 cm y 300 cm.")
    .optional(),
  notasObservaciones: z.string(),
});

type FormularioValues = z.infer<typeof esquema>;
type CampoFormulario = keyof FormularioValues;

const VACIO = "";

export function DialogoMedida({
  abierto,
  onOpenChange,
  pacienteId,
  estaturaSugerida,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  pacienteId: Guid;
  estaturaSugerida?: number;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar medicion</DialogTitle>
          <DialogDescription>
            Peso y estatura son los unicos campos obligatorios.
          </DialogDescription>
        </DialogHeader>

        <FormularioMedida
          key={abierto ? "abierta" : "cerrada"}
          pacienteId={pacienteId}
          estaturaSugerida={estaturaSugerida}
          onCerrar={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function FormularioMedida({
  pacienteId,
  estaturaSugerida,
  onCerrar,
}: {
  pacienteId: Guid;
  estaturaSugerida?: number;
  onCerrar: () => void;
}) {
  const registrar = useRegistrarMedida(pacienteId);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const form = useForm<FormularioValues>({
    resolver: zodResolver(esquema),
    mode: "onBlur",
    defaultValues: {
      peso: undefined,
      estatura: estaturaSugerida,
      porcentajeGrasa: undefined,
      porcentajeMasaMuscular: undefined,
      medidaCintura: undefined,
      medidaCadera: undefined,
      notasObservaciones: VACIO,
    },
  });

  const alEnviar = form.handleSubmit((values) => {
    setErrorGeneral(null);

    const aNull = (valor: number | undefined) =>
      valor === undefined || Number.isNaN(valor) ? null : valor;

    const datos: CrearMedidaDto = {
      peso: values.peso,
      estatura: values.estatura,
      porcentajeGrasa: aNull(values.porcentajeGrasa),
      porcentajeMasaMuscular: aNull(values.porcentajeMasaMuscular),
      medidaCintura: aNull(values.medidaCintura),
      medidaCadera: aNull(values.medidaCadera),
      notasObservaciones:
        values.notasObservaciones.trim() === VACIO
          ? null
          : values.notasObservaciones.trim(),
    };

    registrar.mutate(datos, {
      onSuccess: onCerrar,
      onError: (error: unknown) => {
        for (const [campo, mensaje] of Object.entries(erroresPorCampo(error))) {
          form.setError(campo as CampoFormulario, { message: mensaje });
        }
        setErrorGeneral(mensajeDeError(error));
      },
    });
  });

  const peso = form.watch("peso");
  const estatura = form.watch("estatura");
  const imc = calcularImc(peso ?? 0, estatura ?? 0);

  return (
    <Form {...form}>
      <form onSubmit={alEnviar} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="peso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="Ej. 72.4"
                    {...campoNumero(field)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estatura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estatura (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    placeholder="Ej. 175"
                    {...campoNumero(field)}
                  />
                </FormControl>
                <FormDescription className="text-muted-foreground text-xs">
                  {estaturaSugerida
                    ? "Tomada de la ultima medicion."
                    : "Ultima medicion registrada."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {imc !== null && peso && estatura && (
          <div className="bg-muted/60 flex items-center justify-between rounded-lg px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              IMC{" "}
              <span className="text-foreground font-semibold tabular-nums">
                {imc.toFixed(1)}
              </span>
            </span>
            <span className="text-muted-foreground text-xs">
              {categoriaImc(imc).etiqueta}
            </span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="porcentajeGrasa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>% grasa</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="Ej. 22.4"
                    {...campoNumero(field)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="porcentajeMasaMuscular"
            render={({ field }) => (
              <FormItem>
                <FormLabel>% masa muscular</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="Ej. 34.1"
                    {...campoNumero(field)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="medidaCintura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cintura (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="Ej. 84"
                    {...campoNumero(field)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="medidaCadera"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cadera (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="Ej. 98"
                    {...campoNumero(field)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notasObservaciones"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Como se siente el paciente, contexto de la toma..."
                  rows={2}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-muted-foreground text-xs">
                Opcional.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
            onClick={onCerrar}
            disabled={registrar.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={registrar.isPending}>
            {registrar.isPending && <Loader2 className="size-4 animate-spin" />}
            Registrar medicion
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
