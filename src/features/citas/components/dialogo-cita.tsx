import { useMemo, useState } from "react";
import { useWatch, useForm } from "react-hook-form";
import {
  CalendarClock,
  CalendarPlus,
  Loader2,
  MessageSquareText,
  PencilLine,
  UsersRound,
} from "lucide-react";
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
import { ATAJOS_AGENDA } from "@/components/ui/atajos-fecha";
import { AlertaFormulario, GrupoCampos } from "@/components/ui/grupo-campos";
import { Label } from "@/components/ui/label";
import { Segmentado } from "@/components/ui/segmentado";
import { SelectorFecha } from "@/components/ui/selector-fecha";
import { SelectorHora } from "@/components/ui/selector-hora";
import { Sugerencias } from "@/components/ui/sugerencias";
import { Textarea } from "@/components/ui/textarea";
import { HojaCalendario } from "@/components/ficha/hoja-calendario";
import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
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
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader icono={editando ? PencilLine : CalendarPlus}>
          <DialogTitle>{editando ? "Editar cita" : "Agendar cita"}</DialogTitle>
          <DialogDescription>
            {editando
              ? "Mueve la franja o cambia el nutricionista. El paciente no se puede cambiar."
              : "Elige el día, la hora y quién atiende."}
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

/** Duraciones de un clic: cubren casi todas las consultas. */
const DURACIONES = [
  { valor: "30", etiqueta: "30 min" },
  { valor: "45", etiqueta: "45 min" },
  { valor: "60", etiqueta: "1 h" },
  { valor: "90", etiqueta: "1 h 30" },
];

/** Motivos frecuentes: rellenan el campo, que sigue siendo libre. */
const MOTIVOS_FRECUENTES = [
  "Primera valoración",
  "Seguimiento",
  "Ajuste de plan",
  "Revisión de análisis",
];

const MAX_MOTIVO = 500;

function minutosDe(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function describirDuracion(minutos: number): string {
  if (minutos <= 0) return "";
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

const FORMATO_DIA_RESUMEN = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

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

  const fechaInicioVigente = useWatch({ control: form.control, name: "fechaInicio" });
  const fechaFinVigente = useWatch({ control: form.control, name: "fechaFin" });
  const motivoVigente = useWatch({ control: form.control, name: "motivo" });

  const dia = fechaDe(fechaInicioVigente);
  const horaInicio = horaDe(fechaInicioVigente);
  const horaFin = horaDe(fechaFinVigente);
  const duracion = horaInicio && horaFin ? minutosDe(horaFin) - minutosDe(horaInicio) : 0;

  // Una cita nueva no se agenda en un dia que ya paso.
  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Solo horas posteriores a la de inicio para poder cerrar la cita.
  const horasFin = useMemo(() => {
    const desde = horaInicio || "08:00";
    const posteriores = HORAS_AGENDA.filter((valor) => valor > desde);
    return posteriores.length > 0 ? posteriores : [sumaMinutos(desde, 30)];
  }, [horaInicio]);

  /* Una cita no cruza de dia: inicio y fin comparten la fecha, asi que todo
     cambio se escribe en los dos campos a la vez. */
  const escribirFranja = (fecha: Date, inicio: string, fin: string) => {
    const opciones = { shouldValidate: true, shouldDirty: true };
    form.setValue("fechaInicio", componerFechaHora(fecha, inicio), opciones);
    form.setValue("fechaFin", componerFechaHora(fecha, fin), opciones);
  };

  const duracionVigente = duracion > 0 ? duracion : 60;

  const cambiarDia = (fecha: Date | undefined) => {
    if (!fecha) return;
    const inicio = horaInicio || "09:00";
    escribirFranja(fecha, inicio, sumaMinutos(inicio, duracionVigente));
  };

  // Al mover el inicio se conserva la duracion elegida.
  const cambiarInicio = (hora: string) => {
    if (!dia) return;
    escribirFranja(dia, hora, sumaMinutos(hora, duracionVigente));
  };

  const cambiarFin = (hora: string) => {
    if (!dia) return;
    escribirFranja(dia, horaInicio, hora);
  };

  const cambiarDuracion = (minutos: string) => {
    if (!dia || !horaInicio) return;
    escribirFranja(dia, horaInicio, sumaMinutos(horaInicio, Number(minutos)));
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

  const errores = form.formState.errors;
  const errorFranja = errores.fechaInicio?.message ?? errores.fechaFin?.message;

  return (
    <Form {...form}>
      <form onSubmit={alEnviar} noValidate className="space-y-5">
        <GrupoCampos titulo="Quién" icono={UsersRound}>
          <div className="grid gap-4 sm:grid-cols-2">
            {pacienteSoloLectura ? (
              <div className="grid gap-2">
                <span className="text-sm leading-none font-medium">Paciente</span>
                {/* Fijo: se muestra como ficha, no como un campo apagado. */}
                <div className="border-border bg-surface-subtle flex h-10 items-center gap-2.5 rounded-md border px-2.5">
                  <AvatarPaciente
                    nombre={nombrePaciente || "Paciente"}
                    id={pacienteIdFijo || "paciente"}
                    className="size-6 text-[10px]"
                  />
                  <span className="text-foreground truncate text-sm font-medium">
                    {nombrePaciente || "Paciente seleccionado"}
                  </span>
                </div>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="pacienteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-card h-10 w-full">
                          <SelectValue placeholder="Selecciona un paciente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className="max-h-72">
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
                      <SelectTrigger className="bg-card h-10 w-full">
                        <SelectValue placeholder="Selecciona un nutricionista" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="max-h-72">
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
          </div>
        </GrupoCampos>

        <GrupoCampos titulo="Cuándo" icono={CalendarClock}>
          <FormField
            control={form.control}
            name="fechaInicio"
            render={() => (
              <FormItem>
                <FormLabel>Día</FormLabel>
                <FormControl>
                  <SelectorFecha
                    value={dia}
                    onChange={cambiarDia}
                    desde={cita ? undefined : hoy}
                    atajos={ATAJOS_AGENDA}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="hora-inicio-cita">Empieza</Label>
              <SelectorHora
                id="hora-inicio-cita"
                value={horaInicio}
                onChange={cambiarInicio}
                horas={HORAS_AGENDA}
                disabled={!dia}
                aria-invalid={Boolean(errores.fechaInicio)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hora-fin-cita">Termina</Label>
              <SelectorHora
                id="hora-fin-cita"
                value={horaFin}
                onChange={cambiarFin}
                horas={horasFin}
                disabled={!dia}
                aria-invalid={Boolean(errores.fechaFin)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-muted-foreground text-xs font-medium">Duración</span>
            <Segmentado
              variante="chips"
              aria-label="Duración de la cita"
              value={
                DURACIONES.some((d) => Number(d.valor) === duracion)
                  ? String(duracion)
                  : undefined
              }
              onChange={cambiarDuracion}
              opciones={DURACIONES}
              disabled={!horaInicio}
            />
          </div>

          {/* Los errores de inicio y fin se leen en un solo sitio, bajo la franja. */}
          {errorFranja && (
            <p role="alert" className="text-destructive text-xs font-medium">
              {errorFranja}
            </p>
          )}

          {dia && horaInicio && horaFin && duracion > 0 && (
            <div className="border-primary/20 bg-primary-soft/60 flex items-center gap-3 rounded-lg border p-2.5">
              <HojaCalendario fecha={dia} />
              <div className="min-w-0 text-sm">
                <p className="text-foreground font-semibold first-letter:uppercase">
                  {FORMATO_DIA_RESUMEN.format(dia)}
                </p>
                <p className="text-muted-foreground tabular-nums">
                  De {horaInicio} a {horaFin}
                  <span className="text-primary-soft-foreground ml-2 font-medium">
                    {describirDuracion(duracion)}
                  </span>
                </p>
              </div>
            </div>
          )}
        </GrupoCampos>

        <GrupoCampos titulo="Motivo" icono={MessageSquareText}>
          <FormField
            control={form.control}
            name="motivo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Motivo de la cita</FormLabel>
                <Sugerencias
                  etiqueta="Motivos frecuentes"
                  opciones={MOTIVOS_FRECUENTES}
                  valor={field.value}
                  onElegir={(motivo) =>
                    form.setValue("motivo", motivo, { shouldDirty: true, shouldValidate: true })
                  }
                />
                <FormControl>
                  <Textarea
                    placeholder="Qué se revisará en la consulta (opcional)"
                    rows={3}
                    maxLength={MAX_MOTIVO}
                    className="bg-card resize-none"
                    {...field}
                  />
                </FormControl>
                <div className="flex items-start justify-between gap-3">
                  <FormMessage />
                  <span className="text-muted-foreground-subtle ml-auto text-xs tabular-nums">
                    {motivoVigente.length}/{MAX_MOTIVO}
                  </span>
                </div>
              </FormItem>
            )}
          />
        </GrupoCampos>

        {errorGeneral && <AlertaFormulario>{errorGeneral}</AlertaFormulario>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar} disabled={guardando}>
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
