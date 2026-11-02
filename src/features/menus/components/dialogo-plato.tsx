import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, UtensilsCrossed, X } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImagenAlimento } from "@/features/menus/components/imagen-alimento";
import { LineaMacros } from "@/features/menus/components/comunes";
import { useActualizarPlato, useAlimentos, useCrearPlato } from "@/features/menus/hooks/use-menus";
import {
  formatearKcal,
  LIMITES,
  MACROS_CERO,
  nuevaClave,
  sumarMacros,
  type Macros,
} from "@/features/menus/lib/menus";
import { mensajeDeError } from "@/lib/api-error";
import type { Alimento, Guid, Plato } from "@/types/api";

interface Ingrediente {
  clave: string;
  id?: Guid;
  alimentoId: Guid | "";
  gramos: number | undefined;
}

export function DialogoPlato({
  abierto,
  onOpenChange,
  plato,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  plato?: Plato | null;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        {abierto && <Contenido plato={plato ?? null} onCerrar={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({ plato, onCerrar }: { plato: Plato | null; onCerrar: () => void }) {
  const crear = useCrearPlato();
  const actualizar = useActualizarPlato();
  const alimentosConsulta = useAlimentos({ soloActivos: true, ordenarPor: "nombre" });

  const [nombre, setNombre] = useState(plato?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(plato?.descripcion ?? "");
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(() =>
    plato
      ? [...plato.detalles]
          .sort((a, b) => a.orden - b.orden)
          .map((d) => ({ clave: nuevaClave(), id: d.id, alimentoId: d.alimentoId, gramos: d.racionGramos }))
      : [{ clave: nuevaClave(), alimentoId: "", gramos: 100 }],
  );
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  /* Los alimentos eliminados que el plato ya usaba no vienen en la lista de
     activos; se suman desde el propio plato para no dejar filas huerfanas. */
  const alimentos = useMemo(() => {
    const mapa = new Map<Guid, Pick<Alimento, "id" | "nombre"> & Macros>();
    for (const a of alimentosConsulta.data ?? []) mapa.set(a.id, a);
    for (const d of plato?.detalles ?? []) {
      if (!mapa.has(d.alimentoId) && d.racionGramos > 0) {
        const factor = 100 / d.racionGramos;
        mapa.set(d.alimentoId, {
          id: d.alimentoId,
          nombre: d.alimentoNombre,
          calorias: d.calorias * factor,
          proteinas: d.proteinas * factor,
          carbohidratos: d.carbohidratos * factor,
          grasas: d.grasas * factor,
        });
      }
    }
    return mapa;
  }, [alimentosConsulta.data, plato]);

  const macrosDe = (ingrediente: Ingrediente): Macros | null => {
    const alimento = ingrediente.alimentoId ? alimentos.get(ingrediente.alimentoId) : undefined;
    if (!alimento || !ingrediente.gramos) return null;
    return sumarMacros(MACROS_CERO, alimento, ingrediente.gramos / 100);
  };

  const total = ingredientes.reduce((suma, i) => {
    const m = macrosDe(i);
    return m ? sumarMacros(suma, m) : suma;
  }, MACROS_CERO);

  const cambiar = (clave: string, cambios: Partial<Ingrediente>) =>
    setIngredientes((actuales) => actuales.map((i) => (i.clave === clave ? { ...i, ...cambios } : i)));

  const errorNombre = intentoEnviar && nombre.trim() === "" ? "El nombre es obligatorio." : null;
  const filasValidas = ingredientes.filter((i) => i.alimentoId && i.gramos && i.gramos > 0);
  const errorFilas = (() => {
    if (!intentoEnviar) return null;
    if (filasValidas.length === 0) return "Agrega al menos un alimento con su ración.";
    if (ingredientes.some((i) => i.gramos !== undefined && i.gramos > LIMITES.racionGramos))
      return `Una ración no puede superar ${LIMITES.racionGramos} g.`;
    return null;
  })();

  const guardando = crear.isPending || actualizar.isPending;

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setIntentoEnviar(true);
    setErrorGeneral(null);
    if (nombre.trim() === "" || filasValidas.length === 0) return;
    if (ingredientes.some((i) => i.gramos !== undefined && i.gramos > LIMITES.racionGramos)) return;

    const detalles = filasValidas.map((i, orden) => ({
      id: i.id ?? null,
      alimentoId: i.alimentoId as Guid,
      racionGramos: i.gramos as number,
      orden,
    }));
    const dto = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() === "" ? null : descripcion.trim(),
      imagenUrl: plato?.imagenUrl ?? null,
      detalles,
    };

    try {
      if (plato) {
        await actualizar.mutateAsync({ platoId: plato.id, dto });
        toast.success("Plato actualizado", { description: dto.nombre });
      } else {
        await crear.mutateAsync(dto);
        toast.success("Plato creado", { description: dto.nombre });
      }
      onCerrar();
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    }
  };

  const listaAlimentos = alimentosConsulta.data ?? [];
  const sinCatalogo = alimentosConsulta.isSuccess && listaAlimentos.length === 0;

  return (
    <>
      <DialogHeader icono={UtensilsCrossed}>
        <DialogTitle>{plato ? "Editar plato" : "Nuevo plato"}</DialogTitle>
        <DialogDescription>
          Arma el plato con alimentos del catálogo y su ración en gramos; las macros se calculan solas.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={enviar} noValidate className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="plato-nombre">Nombre</Label>
          <Input
            id="plato-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Pollo a la plancha con arroz integral"
            maxLength={150}
            aria-invalid={errorNombre ? true : undefined}
            className="bg-card h-10"
          />
          {errorNombre && <p className="text-destructive text-sm">{errorNombre}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="plato-descripcion">
            Descripción <span className="text-muted-foreground-subtle text-xs font-normal">(opcional)</span>
          </Label>
          <Textarea
            id="plato-descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Preparación o indicaciones para el paciente"
            maxLength={1000}
            rows={2}
            className="bg-card"
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-foreground mb-2 text-sm font-medium">Ingredientes</legend>

          {sinCatalogo && (
            <AlertaFormulario>
              No hay alimentos en el catálogo. Agrégalos primero en la pestaña Alimentos.
            </AlertaFormulario>
          )}

          <div className="space-y-2">
            {ingredientes.map((ingrediente) => {
              const macros = macrosDe(ingrediente);
              const usados = new Set(
                ingredientes.filter((i) => i.clave !== ingrediente.clave).map((i) => i.alimentoId),
              );
              const actual = ingrediente.alimentoId ? alimentos.get(ingrediente.alimentoId) : undefined;
              const opciones = listaAlimentos.filter((a) => !usados.has(a.id));
              /* Un alimento ya eliminado se muestra como opcion para que el
                 Select pueda pintarlo, aunque no se pueda elegir de nuevo. */
              if (actual && !opciones.some((a) => a.id === actual.id)) opciones.unshift(actual as Alimento);

              return (
                <div
                  key={ingrediente.clave}
                  className="grid grid-cols-[minmax(0,1fr)_7.5rem_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_7.5rem_6rem_auto]"
                >
                  <Select
                    value={ingrediente.alimentoId}
                    onValueChange={(valor) => cambiar(ingrediente.clave, { alimentoId: valor })}
                  >
                    <SelectTrigger className="bg-card h-10 w-full" aria-label="Alimento">
                      <SelectValue placeholder="Elige un alimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {opciones.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          <span className="flex items-center gap-2">
                            <ImagenAlimento url={(a as Alimento).imagenUrl} nombre={a.nombre} className="size-6 rounded-md" />
                            {a.nombre}
                            <span className="text-muted-foreground text-xs">· {formatearKcal(a.calorias)}/100 g</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <InputUnidad
                    unidad="g"
                    inputMode="decimal"
                    min={1}
                    step="1"
                    aria-label="Ración en gramos"
                    value={ingrediente.gramos ?? ""}
                    onChange={(e) =>
                      cambiar(ingrediente.clave, {
                        gramos: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                  />

                  <span className="text-muted-foreground hidden text-right text-sm tabular-nums sm:block">
                    {macros ? formatearKcal(macros.calorias) : "—"}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Quitar ingrediente"
                    disabled={ingredientes.length === 1}
                    onClick={() => setIngredientes((a) => a.filter((i) => i.clave !== ingrediente.clave))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={sinCatalogo || ingredientes.length >= listaAlimentos.length}
            onClick={() => setIngredientes((a) => [...a, { clave: nuevaClave(), alimentoId: "", gramos: 100 }])}
          >
            <Plus className="size-3.5" />
            Agregar ingrediente
          </Button>

          {errorFilas && <p className="text-destructive text-sm">{errorFilas}</p>}
        </fieldset>

        <div className="bg-surface-subtle flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
          <div>
            <p className="text-muted-foreground text-xs">Total del plato</p>
            <p className="text-foreground text-lg font-bold tabular-nums">{formatearKcal(total.calorias)}</p>
          </div>
          <LineaMacros macros={total} conBarra />
        </div>

        {errorGeneral && <AlertaFormulario>{errorGeneral}</AlertaFormulario>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando && <Loader2 className="size-4 animate-spin" />}
            {plato ? "Guardar cambios" : "Crear plato"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
