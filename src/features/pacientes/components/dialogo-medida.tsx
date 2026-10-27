import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Activity, ClipboardPlus, Loader2, Ruler, Scale } from "lucide-react";
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
import { AlertaFormulario, GrupoCampos } from "@/components/ui/grupo-campos";
import { InputUnidad } from "@/components/ui/input-unidad";
import { Textarea } from "@/components/ui/textarea";
import { useRegistrarMedida } from "@/features/pacientes/hooks/use-mutaciones-paciente";
import { erroresPorCampo } from "@/lib/errores-formulario";
import { mensajeDeError } from "@/lib/api-error";
import { campoNumero } from "@/lib/campos-formulario";
import { calcularImc } from "@/lib/formatters";
import { MedidorImc } from "@/features/pacientes/components/medidor-imc";
import type { CrearMedidaDto, Guid } from "@/types/api";

/** Replica `CrearMedidaValidator`; el backend sigue siendo la autoridad. */
const esquema = z.object({
  peso: z
    .number({ required_error: "El peso es requerido" })
    .positive("El peso debe ser mayor a 0 kg.")
    .max(400, "Ingresa un peso válido."),
  estatura: z
    .number({ required_error: "La estatura es requerida" })
    .positive("La estatura debe ser mayor a 0 cm.")
    .max(300, "Ingresa una estatura válida en centímetros."),
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
  consultaId,
  estaturaSugerida,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  pacienteId: Guid;
  /** Si se pasa, la medición queda ligada a esa consulta en curso. */
  consultaId?: Guid;
  estaturaSugerida?: number;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader icono={ClipboardPlus}>
          <DialogTitle>Registrar medición</DialogTitle>
          <DialogDescription>
            Peso y estatura bastan para calcular el IMC. Lo demás es opcional.
          </DialogDescription>
        </DialogHeader>

        <FormularioMedida
          key={abierto ? "abierta" : "cerrada"}
          pacienteId={pacienteId}
          consultaId={consultaId}
          estaturaSugerida={estaturaSugerida}
          onCerrar={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function FormularioMedida({
  pacienteId,
  consultaId,
  estaturaSugerida,
  onCerrar,
}: {
  pacienteId: Guid;
  consultaId?: Guid;
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
      consultaId: consultaId ?? null,
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

  const [peso, estatura, cintura, cadera] = useWatch({
    control: form.control,
    name: ["peso", "estatura", "medidaCintura", "medidaCadera"],
  });
  const imc = peso && estatura ? calcularImc(peso, estatura) : null;
  const indiceCinturaCadera = cintura && cadera ? cintura / cadera : null;

  return (
    <Form {...form}>
      <form onSubmit={alEnviar} noValidate className="space-y-5">
        <GrupoCampos titulo="Peso y estatura" icono={Scale}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="peso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso</FormLabel>
                  <FormControl>
                    <InputUnidad
                      unidad="kg"
                      inputMode="decimal"
                      step="0.1"
                      placeholder="72.4"
                      autoFocus
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
                  <FormLabel>Estatura</FormLabel>
                  <FormControl>
                    <InputUnidad
                      unidad="cm"
                      inputMode="numeric"
                      step="1"
                      placeholder="175"
                      {...campoNumero(field)}
                    />
                  </FormControl>
                  {estaturaSugerida !== undefined && (
                    <FormDescription>Tomada de la última medición.</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <MedidorImc imc={imc} />
        </GrupoCampos>

        <GrupoCampos titulo="Composición corporal" icono={Activity} descripcion="Opcional">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="porcentajeGrasa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grasa corporal</FormLabel>
                  <FormControl>
                    <InputUnidad
                      unidad="%"
                      inputMode="decimal"
                      step="0.1"
                      placeholder="22.4"
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
                  <FormLabel>Masa muscular</FormLabel>
                  <FormControl>
                    <InputUnidad
                      unidad="%"
                      inputMode="decimal"
                      step="0.1"
                      placeholder="34.1"
                      {...campoNumero(field)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </GrupoCampos>

        <GrupoCampos titulo="Perímetros" icono={Ruler} descripcion="Opcional">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="medidaCintura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cintura</FormLabel>
                  <FormControl>
                    <InputUnidad
                      unidad="cm"
                      inputMode="decimal"
                      step="0.1"
                      placeholder="84"
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
                  <FormLabel>Cadera</FormLabel>
                  <FormControl>
                    <InputUnidad
                      unidad="cm"
                      inputMode="decimal"
                      step="0.1"
                      placeholder="98"
                      {...campoNumero(field)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {indiceCinturaCadera !== null && (
            <p className="text-muted-foreground text-xs" aria-live="polite">
              Índice cintura-cadera:{" "}
              <span className="text-foreground font-semibold tabular-nums">
                {indiceCinturaCadera.toFixed(2)}
              </span>
            </p>
          )}
        </GrupoCampos>

        <FormField
          control={form.control}
          name="notasObservaciones"
          render={({ field }) => (
            <FormItem>
              <FormLabel opcional>Observaciones</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Cómo se siente el paciente, contexto de la toma..."
                  rows={2}
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
            Registrar medición
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
