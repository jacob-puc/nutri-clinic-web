import { useMemo, useState } from "react";
import { Plus, SlidersHorizontal, X } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Segmentado } from "@/components/ui/segmentado";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampoRacion, ResumenRacion } from "@/features/menus/components/campo-racion";
import { ImagenAlimento } from "@/features/menus/components/imagen-alimento";
import { LineaMacros } from "@/features/menus/components/comunes";
import { useAlimentos } from "@/features/menus/hooks/use-menus";
import { camposDeMedida, racionDeDetalle, racionEnGramos, type Racion } from "@/features/menus/lib/medidas";
import { formatearKcal, LIMITES, MACROS_CERO, nuevaClave, sumarMacros, type Macros } from "@/features/menus/lib/menus";
import {
  esVarianteDe,
  nombreVariante,
  type IngredienteVariante,
  type VarianteLinea,
} from "@/features/menus/lib/variantes";
import type { Alimento, Guid, Plato } from "@/types/api";

type Alcance = "esta" | "todas";

/**
 * Ajusta los ingredientes de un plato solo para el plan de un paciente. No
 * guarda nada: devuelve el ajuste al editor y el plato variante se crea al
 * guardar el plan, para no dejar platos sueltos si se cancela.
 */
export function DialogoAjustarPlato({
  abierto,
  onOpenChange,
  plato,
  varianteActual,
  pacienteNombre,
  ocurrencias,
  onAplicar,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  /** Plato que tiene hoy la comida (puede ser ya una variante del paciente). */
  plato: Plato | null;
  /** Ajuste pendiente, si ya se habia ajustado sin guardar. */
  varianteActual?: VarianteLinea;
  pacienteNombre: string;
  /** Veces que el plato aparece en el plan: permite aplicar el ajuste a todas. */
  ocurrencias: number;
  onAplicar: (variante: VarianteLinea, alcance: Alcance) => void;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        {abierto && plato && (
          <Contenido
            plato={plato}
            varianteActual={varianteActual}
            pacienteNombre={pacienteNombre}
            ocurrencias={ocurrencias}
            onAplicar={(variante, alcance) => {
              onAplicar(variante, alcance);
              onOpenChange(false);
            }}
            onCerrar={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface Fila extends Pick<IngredienteVariante, "alimentoId" | "alimentoNombre"> {
  racion: Racion;
  clave: string;
}

function Contenido({
  plato,
  varianteActual,
  pacienteNombre,
  ocurrencias,
  onAplicar,
  onCerrar,
}: {
  plato: Plato;
  varianteActual?: VarianteLinea;
  pacienteNombre: string;
  ocurrencias: number;
  onAplicar: (variante: VarianteLinea, alcance: Alcance) => void;
  onCerrar: () => void;
}) {
  const alimentosConsulta = useAlimentos({ soloActivos: true, ordenarPor: "nombre" });
  const yaEsVariante = esVarianteDe(plato, pacienteNombre);

  const [nombre, setNombre] = useState(
    varianteActual?.nombre ?? (yaEsVariante ? plato.nombre : nombreVariante(plato.nombre, pacienteNombre)),
  );
  const [filas, setFilas] = useState<Fila[]>(() =>
    (varianteActual?.ingredientes ??
      [...plato.detalles]
        .sort((a, b) => a.orden - b.orden)
        .map((d) => ({
          alimentoId: d.alimentoId,
          alimentoNombre: d.alimentoNombre,
          racionGramos: d.racionGramos,
          medidaCantidad: d.medidaCantidad,
          medidaNombre: d.medidaNombre,
        }))
    ).map((i) => ({
      alimentoId: i.alimentoId,
      alimentoNombre: i.alimentoNombre,
      racion: racionDeDetalle({
        racionGramos: i.racionGramos,
        medidaCantidad: i.medidaCantidad ?? null,
        medidaNombre: i.medidaNombre ?? null,
      }),
      clave: nuevaClave(),
    })),
  );
  const [alcance, setAlcance] = useState<Alcance>(ocurrencias > 1 ? "todas" : "esta");
  const [intento, setIntento] = useState(false);

  /* Macros por gramo: del catalogo y, para alimentos que ya no esten activos,
     deducidas del propio plato (sus detalles traen las macros de la racion). */
  const porGramo = useMemo(() => {
    const mapa = new Map<Guid, Macros>();
    for (const d of plato.detalles) {
      if (d.racionGramos > 0) mapa.set(d.alimentoId, sumarMacros(MACROS_CERO, d, 1 / d.racionGramos));
    }
    for (const a of alimentosConsulta.data ?? []) mapa.set(a.id, sumarMacros(MACROS_CERO, a, 1 / 100));
    return mapa;
  }, [plato, alimentosConsulta.data]);

  const macrosDe = (lista: Fila[]) =>
    lista.reduce((s, f) => {
      const m = porGramo.get(f.alimentoId);
      const gramos = f.racion.gramos ?? 0;
      return m && gramos > 0 ? sumarMacros(s, m, gramos) : s;
    }, MACROS_CERO);

  const original: Macros = {
    calorias: plato.caloriasTotales,
    proteinas: plato.proteinasTotales,
    carbohidratos: plato.carbohidratosTotales,
    grasas: plato.grasasTotales,
  };
  const ajustado = macrosDe(filas);
  const diferencia = ajustado.calorias - original.calorias;

  const medidasDe = new Map((alimentosConsulta.data ?? []).map((a) => [a.id, a.medidas]));
  const usados = new Set(filas.map((f) => f.alimentoId));
  const disponibles = (alimentosConsulta.data ?? []).filter((a) => !usados.has(a.id));

  const errores = {
    nombre: nombre.trim() === "" ? "Ponle un nombre." : null,
    filas:
      filas.length === 0
        ? "El plato necesita al menos un ingrediente."
        : filas.some((f) => !((f.racion.gramos ?? 0) > 0) || (f.racion.gramos ?? 0) > LIMITES.racionGramos)
          ? `Cada ración debe estar entre 1 y ${LIMITES.racionGramos} g.`
          : null,
  };

  const agregar = (alimento: Alimento) =>
    setFilas((a) => [
      ...a,
      { clave: nuevaClave(), alimentoId: alimento.id, alimentoNombre: alimento.nombre, racion: racionEnGramos(100) },
    ]);

  const aplicar = () => {
    setIntento(true);
    if (errores.nombre || errores.filas) return;
    onAplicar(
      {
        clave: varianteActual?.clave ?? nuevaClave(),
        nombre: nombre.trim(),
        platoBaseId: varianteActual?.platoBaseId ?? plato.id,
        platoVarianteId: varianteActual?.platoVarianteId ?? (yaEsVariante ? plato.id : undefined),
        ingredientes: filas.map(({ alimentoId, alimentoNombre, racion }) => ({
          alimentoId,
          alimentoNombre,
          racionGramos: racion.gramos as number,
          ...camposDeMedida(racion),
        })),
        macros: ajustado,
      },
      alcance,
    );
  };

  return (
    <>
      <DialogHeader icono={SlidersHorizontal}>
        <DialogTitle>Ajustar ingredientes</DialogTitle>
        <DialogDescription>
          Solo para el plan de {pacienteNombre}. El plato «{plato.nombre}» del catálogo no cambia.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="variante-nombre">Nombre en el plan</Label>
          <Input
            id="variante-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={150}
            className="bg-card h-10"
            aria-invalid={intento && errores.nombre ? true : undefined}
          />
          {intento && errores.nombre && <p className="text-destructive text-sm">{errores.nombre}</p>}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-foreground mb-2 text-sm font-medium">Ingredientes</legend>
          {filas.map((fila) => {
            const kcal = macrosDe([fila]).calorias;
            return (
              <div
                key={fila.clave}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_15rem_5rem_auto]"
              >
                <span className="flex min-h-9 items-center">
                  <span className="text-foreground line-clamp-2 text-sm leading-tight">{fila.alimentoNombre}</span>
                </span>
                <CampoRacion
                  racion={fila.racion}
                  medidas={medidasDe.get(fila.alimentoId)}
                  etiqueta={fila.alimentoNombre}
                  alto="h-9"
                  className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto"
                  onChange={(racion) =>
                    setFilas((a) => a.map((f) => (f.clave === fila.clave ? { ...f, racion } : f)))
                  }
                />
                <ResumenRacion kcal={formatearKcal(kcal)} racion={fila.racion} className="hidden h-9 sm:flex" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Quitar ${fila.alimentoNombre}`}
                  className="col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto"
                  onClick={() => setFilas((a) => a.filter((f) => f.clave !== fila.clave))}
                >
                  <X className="size-4" />
                </Button>
              </div>
            );
          })}

          <Select
            value=""
            onValueChange={(id) => {
              const alimento = disponibles.find((a) => a.id === id);
              if (alimento) agregar(alimento);
            }}
          >
            <SelectTrigger
              className="text-muted-foreground h-9 w-full border-dashed bg-transparent text-sm shadow-none sm:w-64"
              aria-label="Agregar ingrediente"
              disabled={disponibles.length === 0}
            >
              <span className="flex items-center gap-1.5">
                <Plus className="size-3.5" aria-hidden />
                <SelectValue placeholder="Agregar ingrediente" />
              </span>
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-72">
              {disponibles.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <span className="flex items-center gap-2">
                    <ImagenAlimento url={a.imagenUrl} nombre={a.nombre} className="size-6 rounded-md" />
                    {a.nombre}
                    <span className="text-muted-foreground text-xs">· {formatearKcal(a.calorias)}/100 g</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {intento && errores.filas && <p className="text-destructive text-sm">{errores.filas}</p>}
        </fieldset>

        <div className="bg-surface-subtle flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
          <div>
            <p className="text-muted-foreground text-xs">Por porción</p>
            <p className="text-foreground text-lg font-bold tabular-nums">
              {formatearKcal(ajustado.calorias)}
              {Math.abs(diferencia) >= 1 && (
                <span className="text-muted-foreground ml-2 text-xs font-medium">
                  {diferencia > 0 ? "+" : "−"}
                  {formatearKcal(Math.abs(diferencia))} vs original
                </span>
              )}
            </p>
          </div>
          <LineaMacros macros={ajustado} conBarra />
        </div>

        {ocurrencias > 1 && (
          <div className="space-y-2">
            <Label>Aplicar a</Label>
            <Segmentado
              aria-label="Dónde aplicar el ajuste"
              value={alcance}
              onChange={setAlcance}
              opciones={[
                { valor: "todas", etiqueta: `Las ${ocurrencias} veces que aparece` },
                { valor: "esta", etiqueta: "Solo esta comida" },
              ]}
            />
          </div>
        )}

        {alimentosConsulta.isError && (
          <AlertaFormulario>No se pudieron cargar los alimentos para agregar ingredientes.</AlertaFormulario>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="button" onClick={aplicar}>
          Aplicar al plan
        </Button>
      </DialogFooter>
    </>
  );
}
