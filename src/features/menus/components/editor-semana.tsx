import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Copy,
  Eraser,
  MessageSquareText,
  MoreHorizontal,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { InputUnidad } from "@/components/ui/input-unidad";
import { LineaMacros } from "@/features/menus/components/comunes";
import { DialogoAjustarPlato } from "@/features/menus/components/dialogo-ajustar-plato";
import { SelectorPlato } from "@/features/menus/components/selector-plato";
import { esVarianteDe, platosParaElegir } from "@/features/menus/lib/variantes";
import {
  evaluarPlato,
  objetivoDelTiempo,
  type PerfilAlimentario,
} from "@/features/menus/lib/compatibilidad";
import {
  DIAS_SEMANA,
  ETIQUETA_DIA,
  ETIQUETA_DIA_CORTA,
  ETIQUETA_TIEMPO,
  formatearKcal,
  formatearNumero,
  LIMITES,
  MACROS_CERO,
  nuevaClave,
  sumarMacros,
  TIEMPOS_COMIDA,
  type LineaSemana,
  type Macros,
} from "@/features/menus/lib/menus";
import { cn } from "@/lib/utils";
import type { DetalleSemanal, DiaSemana, Guid, Plato, TiempoComida } from "@/types/api";

interface PlatoEditor {
  nombre: string;
  /** Macros de una porcion. */
  macros: Macros;
}

/**
 * Editor de la semana: un dia a la vez, con sus seis tiempos de comida. Es
 * el mismo para plantillas y para planes de paciente; el padre guarda las
 * lineas y decide que hacer con ellas.
 */
export function EditorSemana({
  lineas,
  onChange,
  platos,
  detallesOriginales = [],
  objetivoDiario,
  perfil,
  ajustePorPaciente,
  soloLectura = false,
}: {
  lineas: LineaSemana[];
  onChange: (lineas: LineaSemana[]) => void;
  /** Platos activos que se pueden agregar. */
  platos: Plato[];
  /** Detalles ya guardados: dan nombre y macros a platos que ya no estan activos. */
  detallesOriginales?: DetalleSemanal[];
  objetivoDiario?: number | null;
  /** Alergias y gustos del paciente: ordenan el selector y marcan avisos. */
  perfil?: PerfilAlimentario;
  /**
   * En el plan de un paciente: permite ajustar los ingredientes de un plato
   * solo para ese plan (se guarda como variante) y ofrece sus variantes.
   */
  ajustePorPaciente?: { pacienteNombre: string };
  soloLectura?: boolean;
}) {
  const [dia, setDia] = useState<DiaSemana>("Lunes");
  const [notasAbiertas, setNotasAbiertas] = useState<Set<string>>(new Set());
  const [ajustando, setAjustando] = useState<LineaSemana | null>(null);

  const catalogo = useMemo(() => {
    const mapa = new Map<Guid, PlatoEditor>();
    for (const d of detallesOriginales) {
      if (d.cantidad > 0) {
        mapa.set(d.platoId, {
          nombre: d.platoNombre,
          macros: sumarMacros(MACROS_CERO, d, 1 / d.cantidad),
        });
      }
    }
    for (const p of platos) {
      mapa.set(p.id, {
        nombre: p.nombre,
        macros: {
          calorias: p.caloriasTotales,
          proteinas: p.proteinasTotales,
          carbohidratos: p.carbohidratosTotales,
          grasas: p.grasasTotales,
        },
      });
    }
    return mapa;
  }, [platos, detallesOriginales]);

  const platosPorId = useMemo(() => new Map(platos.map((p) => [p.id, p])), [platos]);
  /* Lo que se ofrece al agregar: sin variantes de otros pacientes. */
  const platosElegibles = useMemo(
    () => platosParaElegir(platos, ajustePorPaciente?.pacienteNombre),
    [platos, ajustePorPaciente?.pacienteNombre],
  );

  /** Macros de una porcion: las del ajuste pendiente si lo hay. */
  const porcionDe = (linea: LineaSemana): Macros | undefined =>
    linea.variante?.macros ?? catalogo.get(linea.platoId)?.macros;

  const macrosDeLinea = (linea: LineaSemana): Macros => {
    const porcion = porcionDe(linea);
    return porcion ? sumarMacros(MACROS_CERO, porcion, linea.cantidad || 0) : MACROS_CERO;
  };

  /* Comidas que comparten plato y ajuste: el dialogo ofrece aplicar a todas. */
  const mismasComidas = (linea: LineaSemana) =>
    lineas.filter((l) => l.platoId === linea.platoId && l.variante?.clave === linea.variante?.clave);

  const totalesPorDia = useMemo(() => {
    const totales = new Map<DiaSemana, Macros>(DIAS_SEMANA.map((d) => [d, MACROS_CERO]));
    for (const linea of lineas) {
      const porcion = linea.variante?.macros ?? catalogo.get(linea.platoId)?.macros;
      if (porcion) {
        totales.set(linea.diaSemana, sumarMacros(totales.get(linea.diaSemana)!, porcion, linea.cantidad || 0));
      }
    }
    return totales;
  }, [lineas, catalogo]);

  const lineasDelDia = lineas.filter((l) => l.diaSemana === dia);
  const totalDia = totalesPorDia.get(dia)!;

  const cambiarLinea = (clave: string, cambios: Partial<LineaSemana>) =>
    onChange(lineas.map((l) => (l.clave === clave ? { ...l, ...cambios } : l)));

  const quitarLinea = (clave: string) => onChange(lineas.filter((l) => l.clave !== clave));

  const agregar = (tiempo: TiempoComida, platoId: Guid) =>
    onChange([
      ...lineas,
      { clave: nuevaClave(), platoId, diaSemana: dia, tiempoComida: tiempo, cantidad: 1, indicaciones: "" },
    ]);

  /* Copiar reemplaza el dia destino entero; las copias son filas nuevas
     (sin id) porque en el backend son detalles distintos. */
  const copiarA = (destinos: DiaSemana[]) => {
    const origen = lineas.filter((l) => l.diaSemana === dia);
    const conservadas = lineas.filter((l) => !destinos.includes(l.diaSemana));
    const copias = destinos.flatMap((destino) =>
      origen.map((l) => ({ ...l, id: undefined, clave: nuevaClave(), diaSemana: destino })),
    );
    onChange([...conservadas, ...copias]);
  };

  const alternarNota = (clave: string) =>
    setNotasAbiertas((actuales) => {
      const siguiente = new Set(actuales);
      if (siguiente.has(clave)) siguiente.delete(clave);
      else siguiente.add(clave);
      return siguiente;
    });

  return (
    <div className="space-y-4">
      {/* ---------- Selector de dia con su total ---------- */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div role="tablist" aria-label="Día de la semana" className="grid min-w-[560px] grid-cols-7 gap-1.5">
          {DIAS_SEMANA.map((d) => {
            const kcal = totalesPorDia.get(d)!.calorias;
            const conPlatos = lineas.some((l) => l.diaSemana === d);
            const proporcion = objetivoDiario ? kcal / objetivoDiario : null;
            const fuera = proporcion !== null && conPlatos && Math.abs(proporcion - 1) > 0.1;
            const seleccionado = d === dia;
            return (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={seleccionado}
                onClick={() => setDia(d)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-left transition-colors",
                  seleccionado
                    ? "border-primary bg-primary-soft text-primary-soft-foreground"
                    : "bg-card hover:border-primary/40 hover:bg-accent",
                )}
              >
                <span className="block text-xs font-semibold">{ETIQUETA_DIA_CORTA[d]}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-[11px] tabular-nums",
                    !conPlatos && "text-muted-foreground-subtle",
                    fuera && "text-warning-soft-foreground font-medium",
                  )}
                >
                  {conPlatos ? `${formatearNumero(Math.round(kcal))} kcal` : "Vacío"}
                </span>
                {proporcion !== null && (
                  <span className="bg-muted mt-1.5 block h-1 overflow-hidden rounded-full">
                    <span
                      className={cn("block h-full rounded-full", fuera ? "bg-[var(--warning)]" : "bg-primary")}
                      style={{ width: `${Math.min(100, proporcion * 100)}%` }}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- Resumen del dia ---------- */}
      <div className="bg-surface-subtle flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
        <div>
          <p className="text-muted-foreground text-xs">{ETIQUETA_DIA[dia]}</p>
          <p className="text-foreground text-lg font-bold tabular-nums">
            {formatearKcal(totalDia.calorias)}
            {objetivoDiario ? (
              <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                de {formatearKcal(objetivoDiario)}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LineaMacros macros={totalDia} conBarra />
          {!soloLectura && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <MoreHorizontal className="size-4" />
                  <span className="hidden sm:inline">Día</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Copiar {ETIQUETA_DIA[dia].toLowerCase()} a…</DropdownMenuLabel>
                <DropdownMenuItem
                  disabled={lineasDelDia.length === 0}
                  onSelect={() => copiarA(DIAS_SEMANA.filter((d) => d !== dia))}
                >
                  <Copy />
                  Todos los demás días
                </DropdownMenuItem>
                {DIAS_SEMANA.filter((d) => d !== dia).map((d) => (
                  <DropdownMenuItem key={d} disabled={lineasDelDia.length === 0} onSelect={() => copiarA([d])}>
                    <Copy />
                    {ETIQUETA_DIA[d]}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={lineasDelDia.length === 0}
                  onSelect={() => onChange(lineas.filter((l) => l.diaSemana !== dia))}
                >
                  <Eraser />
                  Vaciar el día
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ---------- Tiempos de comida ---------- */}
      <div className="divide-border divide-y rounded-xl border">
        {TIEMPOS_COMIDA.map((tiempo) => {
          const delTiempo = lineasDelDia.filter((l) => l.tiempoComida === tiempo);
          const subtotal = delTiempo.reduce((s, l) => s + macrosDeLinea(l).calorias, 0);
          const usados = new Set(delTiempo.map((l) => l.platoId));
          /* Lo que falta para la parte del objetivo que toca a esta comida. */
          const metaTiempo = objetivoDelTiempo(objetivoDiario, tiempo);
          const presupuesto = metaTiempo === null ? null : Math.max(0, metaTiempo - subtotal);

          return (
            <section key={tiempo} className="bg-card px-3 py-2.5 first:rounded-t-xl last:rounded-b-xl sm:px-4">
              {/* El selector para agregar va en la misma fila que el titulo:
                  ahorra una fila por comida y el dia cabe sin tanto scroll. */}
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <h4 className="text-foreground text-sm font-semibold">{ETIQUETA_TIEMPO[tiempo]}</h4>
                  {(delTiempo.length > 0 || metaTiempo !== null) && (
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {delTiempo.length > 0 ? formatearKcal(subtotal) : ""}
                      {metaTiempo !== null && (
                        <span className="text-muted-foreground-subtle">
                          {delTiempo.length > 0 ? " de " : "meta "}≈{formatearKcal(Math.round(metaTiempo / 10) * 10)}
                        </span>
                      )}
                    </span>
                  )}
                  {soloLectura && delTiempo.length === 0 && (
                    <span className="text-muted-foreground-subtle text-xs">Sin platos</span>
                  )}
                </div>

                {!soloLectura && (
                  <SelectorPlato
                    platos={platosElegibles}
                    excluidos={usados}
                    presupuesto={presupuesto}
                    perfil={perfil}
                    etiqueta={ETIQUETA_TIEMPO[tiempo]}
                    onElegir={(platoId) => agregar(tiempo, platoId)}
                  />
                )}
              </header>

              {delTiempo.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {delTiempo.map((linea) => {
                    const plato = catalogo.get(linea.platoId);
                    const kcal = macrosDeLinea(linea).calorias;
                    const notaVisible = notasAbiertas.has(linea.clave) || linea.indicaciones !== "";
                    const cantidadInvalida = !(linea.cantidad > 0) || linea.cantidad > LIMITES.porciones;
                    const platoCompleto = platosPorId.get(linea.platoId);
                    const nombreLinea = linea.variante?.nombre ?? plato?.nombre;
                    const porcion = porcionDe(linea);
                    const evaluable = linea.variante
                      ? {
                          nombre: linea.variante.nombre,
                          detalles: linea.variante.ingredientes.map((i) => ({ alimentoNombre: i.alimentoNombre })),
                        }
                      : (platoCompleto ?? { nombre: plato?.nombre ?? "", detalles: [] });
                    const alergenos = perfil ? evaluarPlato(evaluable, perfil).alergenos : [];
                    const personalizado =
                      Boolean(linea.variante) ||
                      (ajustePorPaciente !== undefined &&
                        platoCompleto !== undefined &&
                        esVarianteDe(platoCompleto, ajustePorPaciente.pacienteNombre));
                    const puedeAjustar =
                      ajustePorPaciente !== undefined && (platoCompleto !== undefined || linea.variante !== undefined);
                    return (
                      <li key={linea.clave} className="bg-surface-subtle/60 rounded-lg px-3 py-2">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_5.5rem_auto]">
                          <div className="min-w-0">
                            <p className="text-foreground flex min-w-0 items-center gap-1.5 text-sm font-medium">
                              <span className="truncate">{nombreLinea ?? "Plato no disponible"}</span>
                              {personalizado && (
                                <span className="bg-primary-soft text-primary-soft-foreground shrink-0 rounded px-1.5 py-px text-[10px] font-semibold">
                                  {linea.variante ? "Ajustado · se guarda con el plan" : "Personalizado"}
                                </span>
                              )}
                            </p>
                            {alergenos.length > 0 && (
                              <p className="text-destructive flex items-center gap-1 text-xs font-medium">
                                <AlertTriangle className="size-3" aria-hidden />
                                Contiene {alergenos.join(", ")} (alergia del paciente)
                              </p>
                            )}
                            <p className="text-muted-foreground text-xs tabular-nums">
                              {porcion ? `${formatearKcal(porcion.calorias)} por porción` : "—"}
                            </p>
                          </div>

                          {soloLectura ? (
                            <span className="text-muted-foreground text-sm tabular-nums">
                              × {formatearNumero(linea.cantidad)}
                            </span>
                          ) : (
                            <InputUnidad
                              unidad="porc."
                              inputMode="decimal"
                              step="0.5"
                              min={0.5}
                              aria-label={`Porciones de ${nombreLinea ?? "plato"}`}
                              aria-invalid={cantidadInvalida ? true : undefined}
                              value={Number.isNaN(linea.cantidad) ? "" : linea.cantidad}
                              onChange={(e) =>
                                cambiarLinea(linea.clave, {
                                  cantidad: e.target.value === "" ? Number.NaN : Number(e.target.value),
                                })
                              }
                              className="h-9 pr-14"
                            />
                          )}

                          <span className="text-foreground hidden text-right text-sm font-semibold tabular-nums sm:block">
                            {formatearKcal(kcal)}
                          </span>

                          {!soloLectura && (
                            <div className="col-span-2 flex justify-end gap-0.5 sm:col-span-1">
                              {puedeAjustar && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Ajustar ingredientes de ${nombreLinea ?? "plato"}`}
                                  className={cn(linea.variante && "text-primary")}
                                  onClick={() => setAjustando(linea)}
                                >
                                  <SlidersHorizontal className="size-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Indicaciones"
                                aria-pressed={notaVisible}
                                className={cn(linea.indicaciones && "text-primary")}
                                onClick={() => alternarNota(linea.clave)}
                              >
                                <MessageSquareText className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Quitar ${nombreLinea ?? "plato"}`}
                                onClick={() => quitarLinea(linea.clave)}
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {notaVisible &&
                          (soloLectura ? (
                            <p className="text-muted-foreground mt-1.5 text-xs italic">{linea.indicaciones}</p>
                          ) : (
                            <Input
                              value={linea.indicaciones}
                              onChange={(e) => cambiarLinea(linea.clave, { indicaciones: e.target.value })}
                              placeholder="Indicaciones: sin sal, cambiar arroz por quinoa…"
                              maxLength={500}
                              className="bg-card mt-2 h-9 text-sm"
                            />
                          ))}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {ajustePorPaciente && (
        <DialogoAjustarPlato
          abierto={ajustando !== null}
          onOpenChange={(a) => !a && setAjustando(null)}
          plato={ajustando ? (platosPorId.get(ajustando.platoId) ?? null) : null}
          varianteActual={ajustando?.variante}
          pacienteNombre={ajustePorPaciente.pacienteNombre}
          ocurrencias={ajustando ? mismasComidas(ajustando).length : 0}
          onAplicar={(variante, alcance) => {
            if (!ajustando) return;
            const destino = new Set(
              (alcance === "todas" ? mismasComidas(ajustando) : [ajustando]).map((l) => l.clave),
            );
            onChange(lineas.map((l) => (destino.has(l.clave) ? { ...l, variante } : l)));
          }}
        />
      )}
    </div>
  );
}
