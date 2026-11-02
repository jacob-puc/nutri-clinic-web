import { useState } from "react";
import { toast } from "sonner";
import { CalendarRange, Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { EditorSemana } from "@/features/menus/components/editor-semana";
import {
  useActualizarPlantillaMenu,
  useCrearPlantillaMenu,
  usePlatos,
} from "@/features/menus/hooks/use-menus";
import {
  hayPorcionesInvalidas,
  LIMITES,
  lineasADetallesDto,
  lineasDesdeDetalles,
  type LineaSemana,
} from "@/features/menus/lib/menus";
import { mensajeDeError } from "@/lib/api-error";
import type { PlantillaMenu } from "@/types/api";

export function DialogoPlantilla({
  abierto,
  onOpenChange,
  plantilla,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  plantilla?: PlantillaMenu | null;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl">
        {abierto && <Contenido plantilla={plantilla ?? null} onCerrar={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({ plantilla, onCerrar }: { plantilla: PlantillaMenu | null; onCerrar: () => void }) {
  const crear = useCrearPlantillaMenu();
  const actualizar = useActualizarPlantillaMenu();
  const platos = usePlatos({ soloActivos: true, ordenarPor: "nombre" });

  const [nombre, setNombre] = useState(plantilla?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(plantilla?.descripcion ?? "");
  const [objetivo, setObjetivo] = useState<number | undefined>(plantilla?.objetivoCalorico ?? undefined);
  const [lineas, setLineas] = useState<LineaSemana[]>(() => lineasDesdeDetalles(plantilla?.detalles ?? []));
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
        ? "Agrega al menos un plato a la semana."
        : hayPorcionesInvalidas(lineas)
          ? `Revisa las porciones: entre 0.5 y ${LIMITES.porciones}.`
          : null,
  };
  const visibles = intentoEnviar ? errores : { nombre: null, objetivo: null, lineas: null };

  const guardando = crear.isPending || actualizar.isPending;

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setIntentoEnviar(true);
    setErrorGeneral(null);
    if (errores.nombre || errores.objetivo || errores.lineas) return;

    const dto = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() === "" ? null : descripcion.trim(),
      objetivoCalorico: objetivo ?? null,
      detalles: lineasADetallesDto(lineas),
    };

    try {
      if (plantilla) {
        await actualizar.mutateAsync({ plantillaId: plantilla.id, dto });
        toast.success("Plantilla actualizada", { description: dto.nombre });
      } else {
        await crear.mutateAsync(dto);
        toast.success("Plantilla creada", { description: dto.nombre });
      }
      onCerrar();
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    }
  };

  return (
    <>
      <DialogHeader icono={CalendarRange}>
        <DialogTitle>{plantilla ? "Editar plantilla" : "Nueva plantilla semanal"}</DialogTitle>
        <DialogDescription>
          Un menú de siete días reutilizable. Al asignarlo a un paciente se copia, así que los cambios aquí no
          alteran planes ya asignados.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={enviar} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <div className="space-y-2">
            <Label htmlFor="plantilla-nombre">Nombre</Label>
            <Input
              id="plantilla-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Déficit moderado 1 800 kcal"
              maxLength={150}
              aria-invalid={visibles.nombre ? true : undefined}
              className="bg-card h-10"
            />
            {visibles.nombre && <p className="text-destructive text-sm">{visibles.nombre}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="plantilla-objetivo">
              Objetivo diario <span className="text-muted-foreground-subtle text-xs font-normal">(opcional)</span>
            </Label>
            <InputUnidad
              id="plantilla-objetivo"
              unidad="kcal"
              inputMode="numeric"
              step="50"
              placeholder="1800"
              value={objetivo ?? ""}
              aria-invalid={visibles.objetivo ? true : undefined}
              onChange={(e) => setObjetivo(e.target.value === "" ? undefined : Number(e.target.value))}
            />
            {visibles.objetivo && <p className="text-destructive text-sm">{visibles.objetivo}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="plantilla-descripcion">
            Descripción <span className="text-muted-foreground-subtle text-xs font-normal">(opcional)</span>
          </Label>
          <Textarea
            id="plantilla-descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Para quién está pensada y qué prioriza"
            maxLength={1000}
            rows={2}
            className="bg-card"
          />
        </div>

        {platos.isSuccess && platos.data.length === 0 && (
          <AlertaFormulario>No hay platos activos. Crea platos en la pestaña Platos antes de armar la semana.</AlertaFormulario>
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
          detallesOriginales={plantilla?.detalles}
          objetivoDiario={objetivo}
        />

        {visibles.lineas && <p className="text-destructive text-sm">{visibles.lineas}</p>}
        {errorGeneral && <AlertaFormulario>{errorGeneral}</AlertaFormulario>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando && <Loader2 className="size-4 animate-spin" />}
            {plantilla ? "Guardar cambios" : "Crear plantilla"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
