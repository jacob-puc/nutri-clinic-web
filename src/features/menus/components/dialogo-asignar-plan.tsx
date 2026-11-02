import { useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertaFormulario } from "@/components/ui/grupo-campos";
import { Input } from "@/components/ui/input";
import { InputUnidad } from "@/components/ui/input-unidad";
import { Label } from "@/components/ui/label";
import { Segmentado } from "@/components/ui/segmentado";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectorFecha } from "@/components/ui/selector-fecha";
import {
  useActualizarMenuAsignado,
  useAsignarPlantilla,
  usePlantillasMenu,
} from "@/features/menus/hooks/use-menus";
import {
  DESCRIPCION_ESTADO,
  DIAS_SEMANA,
  formatearKcal,
  LIMITES,
  lineasADetallesDto,
  lineasDesdeDetalles,
  promedioDiario,
} from "@/features/menus/lib/menus";
import { usePacientes } from "@/features/pacientes/hooks/use-pacientes";
import { mensajeDeError } from "@/lib/api-error";
import { dateOnlyDe } from "@/lib/fechas";
import { hoyCalendario } from "@/lib/zona-horaria";
import type { Guid, MenuAsignado, MenuAsignadoEstado } from "@/types/api";

interface OpcionesAsignacion {
  /** Al asignar desde una plantilla concreta llega ya elegida. */
  plantillaInicial?: Guid;
  pacienteInicial?: Guid;
  estadoInicial?: MenuAsignadoEstado;
  /** Requerimiento estimado del paciente: ordena las plantillas y se sugiere como objetivo. */
  requerimiento?: number | null;
  /** Plan activo actual: si el nuevo nace activo, este pasa a Finalizado. */
  planVigente?: MenuAsignado;
  /** Recibe el plan creado (p. ej. para abrirlo y ajustarlo enseguida). */
  onAsignado?: (plan: MenuAsignado) => void;
}

export function DialogoAsignarPlan({
  abierto,
  onOpenChange,
  ...opciones
}: OpcionesAsignacion & {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        {abierto && (
          <Contenido {...opciones} onCerrar={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({
  plantillaInicial,
  pacienteInicial,
  estadoInicial = "Borrador",
  requerimiento,
  planVigente,
  onAsignado,
  onCerrar,
}: OpcionesAsignacion & { onCerrar: () => void }) {
  const asignar = useAsignarPlantilla();
  const actualizarVigente = useActualizarMenuAsignado();
  const pacientes = usePacientes();
  const plantillas = usePlantillasMenu({ soloActivos: true, ordenarPor: "nombre" });

  const [pacienteId, setPacienteId] = useState<Guid | "">(pacienteInicial ?? "");
  const [plantillaId, setPlantillaId] = useState<Guid | "">(plantillaInicial ?? "");
  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState<number | undefined>(undefined);
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(() => hoyCalendario());
  const [estado, setEstado] = useState<MenuAsignadoEstado>(estadoInicial);
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  /* Una plantilla vacia no se puede asignar (el backend responde 409); se
     muestra igual para que se entienda por que no esta disponible. */
  const plantilla = plantillas.data?.find((p) => p.id === plantillaId);

  /* Plantillas ordenadas por cercania a la referencia (objetivo escrito o,
     si no hay, el requerimiento estimado): las compatibles quedan arriba. */
  const referencia = objetivo ?? requerimiento ?? null;
  const opcionesPlantilla = (plantillas.data ?? [])
    .map((p) => {
      const promedioP = promedioDiario(p.detalles);
      const desvio = referencia && promedioP ? Math.abs(promedioP - referencia) / referencia : null;
      return { plantilla: p, promedio: promedioP, compatible: desvio !== null && desvio <= 0.1, desvio };
    })
    .sort((a, b) => {
      if (a.plantilla.detalles.length === 0 || b.plantilla.detalles.length === 0)
        return a.plantilla.detalles.length === 0 ? 1 : -1;
      if (a.desvio !== null && b.desvio !== null) return a.desvio - b.desvio;
      return a.plantilla.nombre.localeCompare(b.plantilla.nombre, "es");
    });
  const reemplazaVigente = planVigente?.estado === "Activo" && estado === "Activo";
  const promedio = plantilla ? promedioDiario(plantilla.detalles) : null;
  const diasCubiertos = plantilla
    ? DIAS_SEMANA.filter((d) => plantilla.detalles.some((x) => x.diaSemana === d)).length
    : 0;

  const errores = {
    paciente: pacienteId === "" ? "Elige un paciente." : null,
    plantilla: plantillaId === "" ? "Elige la plantilla base." : null,
    fecha: fechaInicio === undefined ? "Indica la fecha de inicio." : null,
    objetivo:
      objetivo !== undefined && (objetivo <= 0 || objetivo > LIMITES.objetivoCalorico)
        ? `Entre 1 y ${LIMITES.objetivoCalorico} kcal.`
        : null,
  };
  const ver = (clave: keyof typeof errores) => (intentoEnviar ? errores[clave] : null);

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setIntentoEnviar(true);
    setErrorGeneral(null);
    if (Object.values(errores).some(Boolean)) return;

    try {
      const plan = await asignar.mutateAsync({
        pacienteId: pacienteId as Guid,
        plantillaMenuId: plantillaId as Guid,
        /* Vacio = el backend usa el nombre de la plantilla. */
        nombre: nombre.trim(),
        objetivoCalorico: objetivo ?? null,
        fechaInicio: dateOnlyDe(fechaInicio!),
        estado,
      });
      /* El backend admite dos planes activos a la vez; para el paciente solo
         uno puede estar vigente, asi que el anterior se cierra aqui. */
      if (reemplazaVigente && planVigente) {
        try {
          await actualizarVigente.mutateAsync({
            menuId: planVigente.id,
            dto: {
              nombre: planVigente.nombre,
              descripcion: planVigente.descripcion,
              objetivoCalorico: planVigente.objetivoCalorico,
              fechaInicio: null,
              estado: "Finalizado",
              detalles: lineasADetallesDto(lineasDesdeDetalles(planVigente.detalles)),
            },
          });
        } catch (error) {
          toast.warning("El plan nuevo quedó activo, pero no se pudo finalizar el anterior", {
            description: mensajeDeError(error),
          });
        }
      }
      toast.success("Plan asignado", { description: `${plan.nombre} · ${plan.pacienteNombre}` });
      onCerrar();
      onAsignado?.(plan);
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    }
  };

  return (
    <>
      <DialogHeader icono={ClipboardCheck}>
        <DialogTitle>Asignar plan a un paciente</DialogTitle>
        <DialogDescription>
          Se copia la plantilla elegida; después puedes ajustar los platos del plan sin tocar la plantilla.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={enviar} noValidate className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="plan-paciente">Paciente</Label>
          <Select value={pacienteId} onValueChange={setPacienteId}>
            <SelectTrigger id="plan-paciente" className="bg-card h-10 w-full" aria-invalid={ver("paciente") ? true : undefined}>
              <SelectValue placeholder={pacientes.isPending ? "Cargando pacientes..." : "Elige un paciente"} />
            </SelectTrigger>
            <SelectContent>
              {[...(pacientes.data ?? [])]
                .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, "es"))
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombreCompleto}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {ver("paciente") && <p className="text-destructive text-sm">{ver("paciente")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan-plantilla">Plantilla base</Label>
          <Select value={plantillaId} onValueChange={setPlantillaId}>
            <SelectTrigger id="plan-plantilla" className="bg-card h-10 w-full" aria-invalid={ver("plantilla") ? true : undefined}>
              <SelectValue placeholder={plantillas.isPending ? "Cargando plantillas..." : "Elige una plantilla"} />
            </SelectTrigger>
            <SelectContent>
              {opcionesPlantilla.map(({ plantilla: p, promedio: promedioP, compatible }) => (
                <SelectItem key={p.id} value={p.id} disabled={p.detalles.length === 0}>
                  {p.nombre}
                  {p.detalles.length === 0 ? (
                    <span className="text-muted-foreground ml-1 text-xs">· sin platos</span>
                  ) : (
                    <span className="text-muted-foreground ml-1 text-xs">· ≈{formatearKcal(promedioP)}/día</span>
                  )}
                  {compatible && (
                    <span className="bg-success-soft text-success-soft-foreground ml-1.5 rounded px-1.5 py-px text-[11px] font-medium">
                      Compatible
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {ver("plantilla") && <p className="text-destructive text-sm">{ver("plantilla")}</p>}
          {plantilla && (
            <p className="text-muted-foreground text-xs">
              {diasCubiertos} de 7 días con platos · promedio {formatearKcal(promedio)} al día
              {plantilla.objetivoCalorico ? ` · objetivo ${formatearKcal(plantilla.objetivoCalorico)}` : ""}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plan-fecha">Inicio</Label>
            <SelectorFecha
              id="plan-fecha"
              value={fechaInicio}
              onChange={setFechaInicio}
              formato="corto"
              aria-invalid={ver("fecha") ? true : undefined}
            />
            {ver("fecha") && <p className="text-destructive text-sm">{ver("fecha")}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-objetivo">
              Objetivo diario <span className="text-muted-foreground-subtle text-xs font-normal">(opcional)</span>
            </Label>
            <InputUnidad
              id="plan-objetivo"
              unidad="kcal"
              inputMode="numeric"
              step="50"
              placeholder={plantilla?.objetivoCalorico ? String(plantilla.objetivoCalorico) : "El de la plantilla"}
              value={objetivo ?? ""}
              aria-invalid={ver("objetivo") ? true : undefined}
              onChange={(e) => setObjetivo(e.target.value === "" ? undefined : Number(e.target.value))}
            />
            {ver("objetivo") ? (
              <p className="text-destructive text-sm">{ver("objetivo")}</p>
            ) : requerimiento ? (
              <p className="text-muted-foreground text-xs">
                Estimado: {formatearKcal(requerimiento)}{" "}
                {objetivo !== requerimiento && (
                  <button
                    type="button"
                    className="text-primary font-medium underline-offset-2 hover:underline"
                    onClick={() => setObjetivo(requerimiento)}
                  >
                    Usar
                  </button>
                )}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan-nombre">
            Nombre del plan <span className="text-muted-foreground-subtle text-xs font-normal">(opcional)</span>
          </Label>
          <Input
            id="plan-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={plantilla?.nombre ?? "Por defecto, el de la plantilla"}
            maxLength={150}
            className="bg-card h-10"
          />
        </div>

        <div className="space-y-2">
          <Label>Estado inicial</Label>
          <Segmentado
            aria-label="Estado inicial"
            value={estado}
            onChange={setEstado}
            opciones={[
              { valor: "Borrador", etiqueta: "Borrador" },
              { valor: "Activo", etiqueta: "Activo" },
            ]}
          />
          <p className="text-muted-foreground text-xs">{DESCRIPCION_ESTADO[estado]}</p>
          {reemplazaVigente && planVigente && (
            <p className="text-warning-soft-foreground text-xs font-medium">
              El plan actual «{planVigente.nombre}» pasará a Finalizado.
            </p>
          )}
        </div>

        {errorGeneral && <AlertaFormulario>{errorGeneral}</AlertaFormulario>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={asignar.isPending || actualizarVigente.isPending}>
            {(asignar.isPending || actualizarVigente.isPending) && <Loader2 className="size-4 animate-spin" />}
            Asignar plan
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
