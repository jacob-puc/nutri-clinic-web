import { useMemo, useState } from "react";
import { useWatch, useForm } from "react-hook-form";
import type { Control } from "react-hook-form";
import { Clock, Loader2 } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useNutricionistas } from "@/features/nutricionistas/hooks/use-nutricionistas";
import { usePacientes } from "@/features/pacientes/hooks/use-pacientes";
import { useActualizarCita, useCrearCita } from "@/features/citas/hooks/use-mutaciones-cita";
import {
  HORAS_AGENDA,
  aInstanteUtc,
  aValorLocal,
  componerFechaHora,
  fechaDe,
  franjaPorDefecto,
  horaDe,
  sumaMinutos,
} from "@/features/citas/lib/fechas-cita";
import { erroresPorCampo } from "@/lib/errores-formulario";
import { mensajeDeError } from "@/lib/api-error";
import type { Cita, Guid } from "@/types/api";

/** Refleja `CrearCitaValidator` / `ActualizarCitaValidator`; el backend manda. */
function construirEsquema(permiteInicioPasado: boolean) {
  return z
    .object({
      pacienteId: z.string().min(1, "El paciente es requerido"),
      nutricionistaId: z.string().min(1, "El nutricionista es requerido"),
      fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
      fechaFin: z.string().min(1, "La fecha de fin es requerida"),
      motivo: z.string().max(500, "El motivo no puede tener más de 500 caracteres"),
    })
    .refine((v) => !v.fechaInicio || !v.fechaFin || v.fechaFin > v.fechaInicio, {
      path: ["fechaFin"],
      message: "La fecha de fin debe ser posterior a la fecha de inicio.",
    })
    .refine(
      (v) =>
        permiteInicioPasado ||
        new Date(v.fechaInicio).getTime() >= Date.now() - 5 * 60_000,
      {
        path: ["fechaInicio"],
        message: "La fecha de inicio no puede estar en el pasado.",
      },
    );
}

type FormularioValues = z.infer<ReturnType<typeof construirEsquema>>;
type CampoFormulario = keyof FormularioValues;

interface DialogoCitaProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  /** Si se pasa, se esta editando una cita existente. */
  cita?: Cita;
  /** Fijado al abrir desde la ficha de un paciente. */
  pacienteId?: Guid;
  pacienteNombre?: string;
}

export function DialogoCita({
  abierto,
  onOpenChange,
  cita,
  pacienteId,
  pacienteNombre,
}: DialogoCitaProps) {
  const editando = Boolean(cita);

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar cita" : "Agendar cita"}</DialogTitle>
          <DialogDescription>
            {editando
              ? "La fecha de inicio no puede quedar en el pasado."
              : "Define la franja y asignale un nutricionista."}
          </DialogDescription>
        </DialogHeader>

        <FormularioCita
          key={cita?.id ?? "nueva"}
          cita={cita}
          pacienteId={pacienteId}
          pacienteNombre={pacienteNombre}
          onCerrar={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function FormularioCita({
  cita,
  pacienteId: pacientePropio,
  pacienteNombre,
  onCerrar,
}: {
  cita?: Cita;
  pacienteId?: Guid;
  pacienteNombre?: string;
  onCerrar: () => void;
}) {
  const { usuario } = useAuth();
  const crear = useCrearCita();
  const actualizar = useActualizarCita(cita?.id ?? "");
  const guardando = cita ? actualizar.isPending : crear.isPending;

  const { data: nutricionistas = [] } = useNutricionistas();
  const { data: pacientes = [] } = usePacientes();

  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // Al editar el paciente no se puede mover: ActualizarCitaDto no lo trae.
  const pacienteSoloLectura = Boolean(cita || pacientePropio);
  const pacienteIdFijo = cita?.pacienteId ?? pacientePropio ?? "";
  const nombrePaciente = cita?.pacienteNombre ?? pacienteNombre ?? "";

  const esquema = construirEsquema(Boolean(cita));
  const franja = franjaPorDefecto();

  const form = useForm<FormularioValues>({
    resolver: zodResolver(esquema),
    mode: "onBlur",
    defaultValues: {
      pacienteId: pacienteIdFijo,
      nutricionistaId: cita?.nutricionistaId ?? usuario?.id ?? "",
      fechaInicio: cita ? aValorLocal(cita.fechaInicio) : franja.inicio,
      fechaFin: cita ? aValorLocal(cita.fechaFin) : franja.fin,
      motivo: cita?.motivo ?? "",
    },
  });

  // La fin sigue a la inicio: una cita no dura dos dias.
  const fechaInicioVigente = useWatch({ control: form.control, name: "fechaInicio" });
  const inicioVigente = fechaDe(fechaInicioVigente);
  const diaInicio = inicioVigente
    ? `${inicioVigente.getFullYear()}-${inicioVigente.getMonth()}-${inicioVigente.getDate()}`
    : "";

  // Solo horas posteriores a la de inicio para poder cerrar la cita.
  const horasFin = useMemo(() => {
    const desde = horaDe(fechaInicioVigente) || "08:00";
    const posteriores = HORAS_AGENDA.filter((valor) => valor > desde);
    return posteriores.length > 0 ? posteriores : [sumaMinutos(desde, 30)];
  }, [fechaInicioVigente]);

  const sincronizarFin = (nuevoInicio: string) => {
    const inicio = fechaDe(nuevoInicio);
    if (!inicio) return;
    const horaInicio = horaDe(nuevoInicio);
    const horaFinActual = horaDe(form.getValues("fechaFin"));
    const horaFin =
      horaFinActual && horaFinActual > horaInicio
        ? horaFinActual
        : sumaMinutos(horaInicio, 30);
    form.setValue("fechaFin", componerFechaHora(inicio, horaFin), {
      shouldValidate: true,
    });
  };

  const alEnviar = form.handleSubmit((values) => {
    setErrorGeneral(null);

    const motivo = values.motivo.trim();
    const fechas = {
      nutricionistaId: values.nutricionistaId,
      fechaInicio: aInstanteUtc(values.fechaInicio),
      fechaFin: aInstanteUtc(values.fechaFin),
      motivo: motivo === "" ? null : motivo,
    };

    const opciones = {
      onSuccess: onCerrar,
      onError: (error: unknown) => {
        for (const [campo, mensaje] of Object.entries(erroresPorCampo(error))) {
          form.setError(campo as CampoFormulario, { message: mensaje });
        }
        setErrorGeneral(mensajeDeError(error));
      },
    };

    if (cita) {
      actualizar.mutate(fechas, opciones);
    } else {
      crear.mutate({ pacienteId: values.pacienteId || pacienteIdFijo, ...fechas }, opciones);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={alEnviar} noValidate className="space-y-4">
        {pacienteSoloLectura ? (
          <div className="space-y-1.5">
            <span className="text-sm font-medium leading-none">Paciente</span>
            <p className="bg-muted/50 rounded-md px-3 py-2 text-sm">
              {nombrePaciente || "Paciente seleccionado"}
            </p>
          </div>
        ) : (
          <FormField
            control={form.control}
            name="pacienteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente</FormLabel>
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.id} value={paciente.id}>
                        {paciente.nombreCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="nutricionistaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nutricionista</FormLabel>
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un nutricionista" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {nutricionistas
                    .filter((n) => n.isActive)
                    .map((nutricionista) => (
                      <SelectItem key={nutricionista.id} value={nutricionista.id}>
                        {nutricionista.nombreCompleto}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <CampoFechaHora
            control={form.control}
            name="fechaInicio"
            etiqueta="Inicio"
            horas={HORAS_AGENDA}
            onCambio={sincronizarFin}
          />
          <CampoFechaHora
            control={form.control}
            name="fechaFin"
            etiqueta="Fin"
            horas={horasFin}
            claveCalendario={diaInicio}
          />
        </div>

        <FormField
          control={form.control}
          name="motivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Primera valoracion, seguimiento, ajuste de plan..."
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
            {cita ? "Guardar cambios" : "Agendar cita"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/** Dia con calendario y hora con selector: ninguna entrada nativa. */
function CampoFechaHora({
  control,
  name,
  etiqueta,
  horas,
  claveCalendario,
  onCambio,
}: {
  control: Control<FormularioValues>;
  name: "fechaInicio" | "fechaFin";
  etiqueta: string;
  horas: string[];
  /** Al cambiar, remonta el calendario para que apunte al dia elegido. */
  claveCalendario?: string;
  onCambio?: (valor: string) => void;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const fecha = fechaDe(field.value);
        const hora = horaDe(field.value);

        const cambiar = (valor: string) => {
          field.onChange(valor);
          onCambio?.(valor);
        };

        return (
          <FormItem className="space-y-2">
            <FormLabel>{etiqueta}</FormLabel>
            <Calendar
              key={claveCalendario}
              selected={fecha}
              onSelect={(nueva) => {
                if (nueva) cambiar(componerFechaHora(nueva, hora || "08:00"));
              }}
            />
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <Select
                value={hora || undefined}
                onValueChange={(nuevaHora) => {
                  if (fecha) cambiar(componerFechaHora(fecha, nuevaHora));
                }}
              >
                <SelectTrigger className="w-32" disabled={!fecha}>
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {horas.map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {valor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-xs">hora local</span>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
