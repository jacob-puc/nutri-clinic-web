import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock, NotebookPen, Printer } from "lucide-react";

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
import { SelectorFecha } from "@/components/ui/selector-fecha";
import { Textarea } from "@/components/ui/textarea";
import { BadgeEstadoPlan } from "@/features/menus/components/comunes";
import { EditorSemana } from "@/features/menus/components/editor-semana";
import {
  useActualizarMenuAsignado,
  useActualizarPlato,
  useCrearPlato,
  usePlatos,
} from "@/features/menus/hooks/use-menus";
import { descripcionVariante } from "@/features/menus/lib/variantes";
import { perfilDesdeHistorial } from "@/features/menus/lib/compatibilidad";
import { useExpediente } from "@/features/pacientes/hooks/use-expediente";
import {
  DESCRIPCION_ESTADO,
  ESTADOS_PLAN,
  hayPorcionesInvalidas,
  LIMITES,
  lineasADetallesDto,
  lineasDesdeDetalles,
  type LineaSemana,
} from "@/features/menus/lib/menus";
import { mensajeDeError } from "@/lib/api-error";
import { abrirPdfConAviso } from "@/lib/pdf";
import { menusApi } from "@/features/menus/api/menus-api";
import { dateOnlyDe, fechaDeDateOnly } from "@/lib/fechas";
import { formatearFechaCorta } from "@/lib/formatters";
import type { Guid, MenuAsignado, MenuAsignadoEstado } from "@/types/api";

export function DialogoPlan({
  abierto,
  onOpenChange,
  plan,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  plan: MenuAsignado | null;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl">
        {abierto && plan && <Contenido plan={plan} onCerrar={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({ plan, onCerrar }: { plan: MenuAsignado; onCerrar: () => void }) {
  const actualizar = useActualizarMenuAsignado();
  const crearPlato = useCrearPlato();
  const actualizarPlato = useActualizarPlato();
  const platos = usePlatos({ soloActivos: true, ordenarPor: "nombre" });
  /* Alergias y gustos del paciente, para ordenar y avisar al agregar platos. */
  const expediente = useExpediente(plan.pacienteId);
  const perfil = perfilDesdeHistorial(expediente.data?.historialClinico);

  /* Reglas del backend: un plan finalizado no se toca y la fecha de inicio
     solo cambia en borrador. Se reflejan aqui para no dejar intentarlo. */
  const soloLectura = plan.estado === "Finalizado" || !plan.isActive;
  const fechaEditable = plan.estado === "Borrador";

  const [nombre, setNombre] = useState(plan.nombre);
  const [descripcion, setDescripcion] = useState(plan.descripcion ?? "");
  const [objetivo, setObjetivo] = useState<number | undefined>(plan.objetivoCalorico ?? undefined);
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(fechaDeDateOnly(plan.fechaInicio));
  const [estado, setEstado] = useState<MenuAsignadoEstado>(plan.estado);
  const [lineas, setLineas] = useState<LineaSemana[]>(() => lineasDesdeDetalles(plan.detalles));
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const errores = {
    nombre: nombre.trim() === "" ? "El nombre es obligatorio." : null,
    objetivo:
      objetivo !== undefined && (objetivo <= 0 || objetivo > LIMITES.objetivoCalorico)
        ? `Entre 1 y ${LIMITES.objetivoCalorico} kcal.`
        : null,
    lineas:
      lineas.length === 0
        ? "El plan debe tener al menos un plato."
        : hayPorcionesInvalidas(lineas)
          ? `Revisa las porciones: entre 0.5 y ${LIMITES.porciones}.`
          : null,
  };
  const ver = (clave: keyof typeof errores) => (intentoEnviar ? errores[clave] : null);
  const guardando = actualizar.isPending || crearPlato.isPending || actualizarPlato.isPending;

  /**
   * Convierte los ajustes de ingredientes en platos variante del paciente y
   * apunta las comidas a ellos. Un ajuste compartido por varias comidas crea
   * un solo plato; si la comida ya usaba una variante de este paciente, esa
   * se actualiza en lugar de crear otra.
   */
  const resolverVariantes = async (actuales: LineaSemana[]): Promise<LineaSemana[]> => {
    const creados = new Map<string, Guid>();
    for (const linea of actuales) {
      const variante = linea.variante;
      if (!variante || creados.has(variante.clave)) continue;
      const dto = {
        nombre: variante.nombre,
        descripcion: descripcionVariante(plan.pacienteNombre),
        imagenUrl: null,
        detalles: variante.ingredientes.map((i, orden) => ({
          alimentoId: i.alimentoId,
          racionGramos: i.racionGramos,
          orden,
        })),
      };
      if (variante.platoVarianteId) {
        await actualizarPlato.mutateAsync({ platoId: variante.platoVarianteId, dto });
        creados.set(variante.clave, variante.platoVarianteId);
      } else {
        const nuevo = await crearPlato.mutateAsync(dto);
        creados.set(variante.clave, nuevo.id);
      }
    }
    return actuales.map((l) =>
      l.variante ? { ...l, platoId: creados.get(l.variante.clave)!, variante: undefined } : l,
    );
  };

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setIntentoEnviar(true);
    setErrorGeneral(null);
    if (Object.values(errores).some(Boolean)) return;

    try {
      /* Las variantes se crean primero y las lineas quedan apuntando a
         ellas: si luego falla el guardado del plan, reintentar no duplica
         los platos. */
      const resueltas = await resolverVariantes(lineas);
      if (resueltas !== lineas) setLineas(resueltas);

      await actualizar.mutateAsync({
        menuId: plan.id,
        dto: {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() === "" ? null : descripcion.trim(),
          objetivoCalorico: objetivo ?? null,
          fechaInicio: fechaEditable && fechaInicio ? dateOnlyDe(fechaInicio) : null,
          estado,
          detalles: lineasADetallesDto(resueltas),
        },
      });
      toast.success("Plan actualizado", { description: `${nombre.trim()} · ${plan.pacienteNombre}` });
      onCerrar();
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    }
  };

  return (
    <>
      <DialogHeader icono={soloLectura ? Lock : NotebookPen}>
        <DialogTitle className="flex flex-wrap items-center gap-2">
          {soloLectura ? plan.nombre : "Editar plan"}
          <BadgeEstadoPlan estado={plan.estado} />
        </DialogTitle>
        <DialogDescription>
          {plan.pacienteNombre}
          {plan.plantillaMenuNombre && ` · basado en ${plan.plantillaMenuNombre}`}
          {` · inicia el ${formatearFechaCorta(plan.fechaInicio)}`}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={enviar} noValidate className="space-y-5">
        {soloLectura ? (
          <AlertaSoloLectura activo={plan.isActive} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
              <div className="space-y-2">
                <Label htmlFor="editar-plan-nombre">Nombre</Label>
                <Input
                  id="editar-plan-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={150}
                  aria-invalid={ver("nombre") ? true : undefined}
                  className="bg-card h-10"
                />
                {ver("nombre") && <p className="text-destructive text-sm">{ver("nombre")}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editar-plan-objetivo">
                  Objetivo diario <span className="text-muted-foreground-subtle text-xs font-normal">(opcional)</span>
                </Label>
                <InputUnidad
                  id="editar-plan-objetivo"
                  unidad="kcal"
                  inputMode="numeric"
                  step="50"
                  value={objetivo ?? ""}
                  aria-invalid={ver("objetivo") ? true : undefined}
                  onChange={(e) => setObjetivo(e.target.value === "" ? undefined : Number(e.target.value))}
                />
                {ver("objetivo") && <p className="text-destructive text-sm">{ver("objetivo")}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Segmentado
                  aria-label="Estado del plan"
                  value={estado}
                  onChange={setEstado}
                  opciones={ESTADOS_PLAN.map((e) => ({ valor: e, etiqueta: e }))}
                />
                <p className="text-muted-foreground text-xs">{DESCRIPCION_ESTADO[estado]}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editar-plan-fecha">Inicio</Label>
                <SelectorFecha
                  id="editar-plan-fecha"
                  value={fechaInicio}
                  onChange={setFechaInicio}
                  formato="corto"
                  disabled={!fechaEditable}
                />
                {!fechaEditable && (
                  <p className="text-muted-foreground text-xs">Solo se puede cambiar mientras el plan está en borrador.</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editar-plan-descripcion">
                Descripción <span className="text-muted-foreground-subtle text-xs font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="editar-plan-descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={1000}
                rows={2}
                className="bg-card"
              />
            </div>
          </>
        )}

        {platos.isError && (
          <AlertaFormulario>
            No se pudieron cargar los platos para agregar: {mensajeDeError(platos.error)}
          </AlertaFormulario>
        )}

        <EditorSemana
          lineas={lineas}
          onChange={setLineas}
          platos={platos.data ?? []}
          detallesOriginales={plan.detalles}
          objetivoDiario={objetivo}
          perfil={perfil}
          ajustePorPaciente={{ pacienteNombre: plan.pacienteNombre }}
          soloLectura={soloLectura}
        />

        {ver("lineas") && <p className="text-destructive text-sm">{ver("lineas")}</p>}
        {errorGeneral && <AlertaFormulario>{errorGeneral}</AlertaFormulario>}

        <DialogFooter>
          {/* Imprime lo guardado: los cambios sin guardar no salen en el PDF. */}
          <Button
            type="button"
            variant="ghost"
            className="sm:mr-auto"
            onClick={() => abrirPdfConAviso(() => menusApi.abrirMenuPdf(plan.id))}
          >
            <Printer className="size-4" />
            Imprimir menú
          </Button>
          {soloLectura ? (
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onCerrar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando && <Loader2 className="size-4 animate-spin" />}
                Guardar cambios
              </Button>
            </>
          )}
        </DialogFooter>
      </form>
    </>
  );
}

function AlertaSoloLectura({ activo }: { activo: boolean }) {
  return (
    <div className="bg-surface-subtle text-muted-foreground flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm">
      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        {activo
          ? "Este plan está finalizado y queda como registro. Para hacer cambios, duplícalo desde el listado."
          : "Este plan está eliminado. Restáuralo desde el listado para volver a editarlo."}
      </p>
    </div>
  );
}
