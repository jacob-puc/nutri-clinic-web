import { useState } from "react";
import { useForm } from "react-hook-form";
import { Contact, Loader2, UserRound, UserRoundPen, UserRoundPlus } from "lucide-react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertaFormulario, GrupoCampos } from "@/components/ui/grupo-campos";
import { Input } from "@/components/ui/input";
import { Segmentado } from "@/components/ui/segmentado";
import { SelectorFecha } from "@/components/ui/selector-fecha";
import { Textarea } from "@/components/ui/textarea";
import { useActualizarPaciente, useCrearPaciente } from "@/features/pacientes/hooks/use-mutaciones-paciente";
import { erroresPorCampo, mensajeDeConflicto } from "@/lib/errores-formulario";
import { dateOnlyDe, fechaDeDateOnly } from "@/lib/fechas";
import { mensajeDeError } from "@/lib/api-error";
import type { CrearPacienteDto, Paciente } from "@/types/api";

const esquema = z.object({
  nombreCompleto: z.string().trim().min(1, "El nombre es requerido"),
  correoElectronico: z
    .string()
    .trim()
    .min(1, "El correo es requerido")
    .email("El correo no es válido"),
  telefono: z
    .string()
    .trim()
    .min(1, "El teléfono es requerido")
    .regex(/^\+?[0-9]{7,15}$/, "El número de teléfono no tiene un formato válido."),
  fechaNacimiento: z.string(),
  sexo: z.enum(["M", "F", "Otro"]),
  direccion: z.string(),
});

type FormularioValues = z.infer<typeof esquema>;

type CampoFormulario = keyof FormularioValues;

const OPCIONES_SEXO: Array<{ valor: FormularioValues["sexo"]; etiqueta: string }> = [
  { valor: "F", etiqueta: "Femenino" },
  { valor: "M", etiqueta: "Masculino" },
  { valor: "Otro", etiqueta: "Otro" },
];

const HOY = new Date();
const PRIMER_MES_NACIMIENTO = new Date(1920, 0, 1);

function edadDe(nacimiento: Date): number {
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const yaCumplio =
    hoy.getMonth() > nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
  if (!yaCumplio) edad -= 1;
  return edad;
}

interface DialogoPacienteProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  paciente?: Paciente;
}

export function DialogoPaciente({
  abierto,
  onOpenChange,
  paciente,
}: DialogoPacienteProps) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader icono={paciente ? UserRoundPen : UserRoundPlus}>
          <DialogTitle>
            {paciente ? "Editar paciente" : "Nuevo paciente"}
          </DialogTitle>
          <DialogDescription>
            {paciente
              ? "Los cambios se aplican de inmediato."
              : "Con nombre, correo y teléfono ya puedes agendarle una cita."}
          </DialogDescription>
        </DialogHeader>

        <FormularioPaciente
          key={paciente?.id ?? "nuevo"}
          paciente={paciente}
          onCerrar={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function FormularioPaciente({
  paciente,
  onCerrar,
}: {
  paciente?: Paciente;
  onCerrar: () => void;
}) {
  const crear = useCrearPaciente();
  const actualizar = useActualizarPaciente(paciente?.id ?? "");
  const guardando = paciente ? actualizar.isPending : crear.isPending;

  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const form = useForm<FormularioValues>({
    resolver: zodResolver(esquema),
    mode: "onBlur",
    defaultValues: {
      nombreCompleto: paciente?.nombreCompleto ?? "",
      correoElectronico: paciente?.correoElectronico ?? "",
      telefono: paciente?.telefono ?? "",
      fechaNacimiento: paciente?.fechaNacimiento ?? "",
      sexo: paciente?.sexo ?? "M",
      direccion: paciente?.direccion ?? "",
    },
  });

  const alEnviar = form.handleSubmit((values) => {
    setErrorGeneral(null);

    const datos: CrearPacienteDto = {
      nombreCompleto: values.nombreCompleto.trim(),
      correoElectronico: values.correoElectronico.trim(),
      telefono: values.telefono.trim(),
      sexo: values.sexo,
      direccion:
        values.direccion.trim() === "" ? null : values.direccion.trim(),
      fechaNacimiento:
        values.fechaNacimiento === "" ? null : values.fechaNacimiento,
    };

    const opciones = {
      onSuccess: onCerrar,
      onError: (error: unknown) => {
        for (const [campo, mensaje] of Object.entries(erroresPorCampo(error))) {
          form.setError(campo as CampoFormulario, { message: mensaje });
        }
        setErrorGeneral(mensajeDeConflicto(error) ?? mensajeDeError(error));
      },
    };

    if (paciente) {
      actualizar.mutate(datos, opciones);
    } else {
      crear.mutate(datos, opciones);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={alEnviar} noValidate className="space-y-5">
        <GrupoCampos titulo="Datos personales" icono={UserRound}>
          <FormField
            control={form.control}
            name="nombreCompleto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="María de los Ángeles López"
                    autoComplete="name"
                    className="bg-card h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fechaNacimiento"
              render={({ field }) => {
                const fecha = fechaDeDateOnly(field.value);
                return (
                  <FormItem>
                    <FormLabel opcional>Fecha de nacimiento</FormLabel>
                    <FormControl>
                      <SelectorFecha
                        value={fecha}
                        onChange={(nueva) => field.onChange(nueva ? dateOnlyDe(nueva) : "")}
                        placeholder="Sin capturar"
                        hasta={HOY}
                        startMonth={PRIMER_MES_NACIMIENTO}
                        endMonth={HOY}
                        conDesplegables
                        limpiable
                        formato="corto"
                        detalle={fecha ? `${edadDe(fecha)} años` : undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="sexo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo</FormLabel>
                  <FormControl>
                    <Segmentado
                      value={field.value}
                      onChange={field.onChange}
                      opciones={OPCIONES_SEXO}
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </GrupoCampos>

        <GrupoCampos titulo="Contacto" icono={Contact}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="correoElectronico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="paciente@correo.com"
                      autoComplete="email"
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
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      placeholder="+525512345678"
                      autoComplete="tel"
                      className="bg-card h-10 tabular-nums"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="direccion"
            render={({ field }) => (
              <FormItem>
                <FormLabel opcional>Dirección</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Calle, número, colonia, ciudad"
                    rows={2}
                    className="bg-card resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </GrupoCampos>

        {errorGeneral && <AlertaFormulario>{errorGeneral}</AlertaFormulario>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCerrar}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando && <Loader2 className="size-4 animate-spin" />}
            {paciente ? "Guardar cambios" : "Registrar paciente"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
