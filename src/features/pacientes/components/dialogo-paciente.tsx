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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActualizarPaciente, useCrearPaciente } from "@/features/pacientes/hooks/use-mutaciones-paciente";
import { erroresPorCampo, mensajeDeConflicto } from "@/features/pacientes/lib/errores-formulario";
import { mensajeDeError } from "@/lib/api-error";
import type { CrearPacienteDto, Paciente } from "@/types/api";

const esquema = z.object({
  nombreCompleto: z.string().trim().min(1, "El nombre es requerido"),
  correoElectronico: z
    .string()
    .trim()
    .min(1, "El correo es requerido")
    .email("El correo no es valido"),
  telefono: z
    .string()
    .trim()
    .min(1, "El telefono es requerido")
    .regex(/^\+?[0-9]{7,15}$/, "El numero de telefono no tiene un formato valido."),
  fechaNacimiento: z.string(),
  sexo: z.enum(["M", "F", "Otro"]),
  direccion: z.string(),
});

type FormularioValues = z.infer<typeof esquema>;

type CampoFormulario = keyof FormularioValues;

function hoyComoDateOnly(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {paciente ? "Editar paciente" : "Nuevo paciente"}
          </DialogTitle>
          <DialogDescription>
            {paciente
              ? "Los cambios se aplican de inmediato."
              : "Solo el nombre, el correo y el telefono son obligatorios."}
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
          <form onSubmit={alEnviar} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="nombreCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Maria de los Angeles Lopez"
                      autoComplete="name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="correoElectronico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electronico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="paciente@correo.com"
                        autoComplete="email"
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
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+525512345678"
                        autoComplete="tel"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fechaNacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de nacimiento</FormLabel>
                    <FormControl>
                      <Input type="date" max={hoyComoDateOnly()} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sexo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Direccion</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Calle, numero, colonia, ciudad"
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
