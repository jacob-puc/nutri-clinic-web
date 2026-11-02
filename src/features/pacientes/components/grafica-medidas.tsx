import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Minus, Target } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { Segmentado } from "@/components/ui/segmentado";
import { categoriaImc } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { formatearInstante } from "@/lib/zona-horaria";
import type { MedidaAntropometrica } from "@/types/api";

const MINIMO_PUNTOS = 2;

type Serie = "peso" | "imc" | "cintura";

const SERIES: Record<Serie, { etiqueta: string; unidad: string; decimales: number }> = {
  peso: { etiqueta: "Peso", unidad: "kg", decimales: 1 },
  imc: { etiqueta: "IMC", unidad: "", decimales: 1 },
  cintura: { etiqueta: "Cintura", unidad: "cm", decimales: 1 },
};

/* Bandas de la OMS: referencia de fondo en la vista de IMC, cada una con su
   nombre escrito (el color nunca va solo). */
const BANDAS_IMC = [
  { desde: 0, hasta: 18.5, etiqueta: "Bajo peso", color: "var(--info)" },
  { desde: 18.5, hasta: 25, etiqueta: "Normal", color: "var(--success)" },
  { desde: 25, hasta: 30, etiqueta: "Sobrepeso", color: "var(--warning)" },
  { desde: 30, hasta: 60, etiqueta: "Obesidad", color: "var(--destructive)" },
];

interface Punto {
  t: number;
  iso: string;
  valor: number;
  /** Cambio frente a la medicion anterior. */
  cambio: number | null;
}

const fmt = (v: number, decimales: number) =>
  new Intl.NumberFormat("es-MX", { maximumFractionDigits: decimales }).format(v);

/**
 * Evolucion del paciente, pensada para leerse de un vistazo en consulta:
 *
 * - Arriba, la conclusion en cifras: donde esta hoy, cuanto cambio desde la
 *   primera medicion y cuanto le falta para su objetivo.
 * - Debajo, UNA medida a la vez sobre un solo eje (antes peso e IMC
 *   compartian la grafica con un segundo eje oculto y sus lineas se cruzaban
 *   sin significado). El eje X es tiempo real: dos visitas separadas por un
 *   mes ya no se dibujan igual de juntas que dos separadas por una semana.
 * - En peso, la linea del objetivo; en IMC, las bandas de la OMS con nombre.
 *
 * El registro completo, en tabla, esta justo debajo en el expediente.
 */
export function GraficaMedidas({
  medidas,
  pesoObjetivo,
}: {
  medidas: MedidaAntropometrica[];
  pesoObjetivo?: number | null;
}) {
  const [serie, setSerie] = useState<Serie>("peso");

  const ordenadas = useMemo(
    () => [...medidas].sort((a, b) => Date.parse(a.fechaMedicion) - Date.parse(b.fechaMedicion)),
    [medidas],
  );

  const hayCintura = ordenadas.filter((m) => m.medidaCintura !== null).length >= MINIMO_PUNTOS;

  const puntos = useMemo<Punto[]>(() => {
    const valores = ordenadas
      .map((m) => ({
        iso: m.fechaMedicion,
        t: Date.parse(m.fechaMedicion),
        valor: serie === "peso" ? m.peso : serie === "imc" ? m.imc : m.medidaCintura,
      }))
      .filter((p): p is { iso: string; t: number; valor: number } => p.valor !== null && p.valor !== undefined);
    return valores.map((p, i) => ({ ...p, cambio: i > 0 ? p.valor - valores[i - 1]!.valor : null }));
  }, [ordenadas, serie]);

  if (ordenadas.length < MINIMO_PUNTOS) return null;

  const primera = ordenadas[0]!;
  const ultima = ordenadas.at(-1)!;
  const cambioPeso = ultima.peso - primera.peso;
  const semanas = Math.max(1, Math.round((Date.parse(ultima.fechaMedicion) - Date.parse(primera.fechaMedicion)) / 604_800_000));
  const faltaObjetivo = pesoObjetivo ? ultima.peso - pesoObjetivo : null;
  const categoria = categoriaImc(ultima.imc);

  const config = SERIES[serie];
  const valores = puntos.map((p) => p.valor);
  const objetivoVisible = serie === "peso" && pesoObjetivo ? pesoObjetivo : null;
  const minimo = Math.min(...valores, ...(objetivoVisible ? [objetivoVisible] : []));
  const maximo = Math.max(...valores, ...(objetivoVisible ? [objetivoVisible] : []));
  /* Eje Y con valores redondos (paso de 1, 2, 5 o 10) en lugar de los que
     salgan de dividir el rango. */
  const holgura = Math.max((maximo - minimo) * 0.2, serie === "imc" ? 0.5 : 1);
  const pasoY = [1, 2, 5, 10, 20].find((p) => (maximo - minimo + 2 * holgura) / p <= 5) ?? 50;
  const dominio: [number, number] = [
    Math.floor((minimo - holgura) / pasoY) * pasoY,
    Math.ceil((maximo + holgura) / pasoY) * pasoY,
  ];
  const marcasY: number[] = [];
  for (let v = dominio[0]; v <= dominio[1] + 1e-9; v += pasoY) marcasY.push(v);

  /* Marcas del eje X: un dia por medicion (dos tomas el mismo dia comparten
     marca), hasta 6 repartidas. */
  const porDia = [...new Map(puntos.map((p) => [formatearInstante(p.t, { dateStyle: "short" }), p.t])).values()];
  const paso = Math.max(1, Math.ceil(porDia.length / 6));
  const marcasX = porDia.filter((_, i) => i % paso === 0 || i === porDia.length - 1);

  return (
    <Card>
      <CardContent className="px-4 py-5 md:px-6">
        {/* ---------- La conclusion, en cifras ---------- */}
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <Cifra etiqueta="Peso actual" valor={`${fmt(ultima.peso, 1)} kg`} detalle={formatearInstante(ultima.fechaMedicion, { day: "numeric", month: "short" })} />
          <Cifra
            etiqueta="Cambio total"
            valor={`${cambioPeso > 0 ? "+" : cambioPeso < 0 ? "−" : ""}${fmt(Math.abs(cambioPeso), 1)} kg`}
            detalle={`en ${semanas} ${semanas === 1 ? "semana" : "semanas"} · ${ordenadas.length} mediciones`}
            icono={Math.abs(cambioPeso) < 0.05 ? Minus : cambioPeso < 0 ? ArrowDown : ArrowUp}
          />
          {faltaObjetivo !== null ? (
            <Cifra
              etiqueta="Para su objetivo"
              valor={Math.abs(faltaObjetivo) < 0.05 ? "Alcanzado" : `${fmt(Math.abs(faltaObjetivo), 1)} kg`}
              detalle={
                Math.abs(faltaObjetivo) < 0.05
                  ? `Objetivo ${fmt(pesoObjetivo!, 1)} kg`
                  : `${faltaObjetivo > 0 ? "por bajar" : "por subir"} · objetivo ${fmt(pesoObjetivo!, 1)} kg`
              }
              icono={Target}
            />
          ) : (
            <Cifra etiqueta="Para su objetivo" valor="—" detalle="Sin peso objetivo definido" />
          )}
          <div>
            <p className="text-muted-foreground text-xs">IMC actual</p>
            <p className="text-foreground mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">{fmt(ultima.imc, 1)}</p>
            <span
              className={cn(
                "mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                categoria.tono === "success" && "bg-success-soft text-success-soft-foreground",
                categoria.tono === "warning" && "bg-warning-soft text-warning-soft-foreground",
                categoria.tono === "destructive" && "bg-destructive-soft text-destructive-soft-foreground",
                categoria.tono === "info" && "bg-info-soft text-info-soft-foreground",
              )}
            >
              {categoria.etiqueta}
            </span>
          </div>
        </div>

        {/* ---------- Una medida a la vez ---------- */}
        <div className="border-border mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <h3 className="text-foreground text-sm font-semibold">
            Evolución de {config.etiqueta.toLowerCase()}
            {config.unidad && <span className="text-muted-foreground font-normal"> ({config.unidad})</span>}
          </h3>
          <Segmentado
            variante="chips"
            aria-label="Medida a graficar"
            value={serie}
            onChange={setSerie}
            opciones={[
              { valor: "peso", etiqueta: "Peso" },
              { valor: "imc", etiqueta: "IMC" },
              ...(hayCintura ? [{ valor: "cintura" as const, etiqueta: "Cintura" }] : []),
            ]}
          />
        </div>

        {/* h-64 fijo: ResponsiveContainer necesita una altura concreta. */}
        <div className="mt-3 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={puntos} margin={{ top: 16, right: 36, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="relleno-evolucion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--primary)" stopOpacity={0.14} />
                  <stop offset="1" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>

              {serie === "imc" &&
                BANDAS_IMC.map((b) => (
                  <ReferenceArea
                    key={b.etiqueta}
                    y1={Math.max(b.desde, dominio[0])}
                    y2={Math.min(b.hasta, dominio[1])}
                    fill={b.color}
                    fillOpacity={0.07}
                    ifOverflow="hidden"
                    label={
                      b.hasta > dominio[0] && b.desde < dominio[1]
                        ? { value: b.etiqueta, position: "insideTopRight", fontSize: 10, fill: "var(--muted-foreground)" }
                        : undefined
                    }
                  />
                ))}

              <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.7} />

              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                ticks={marcasX}
                tickFormatter={(t: number) => formatearInstante(t, { day: "numeric", month: "short" })}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                padding={{ left: 12, right: 12 }}
              />
              <YAxis
                domain={dominio}
                ticks={marcasY}
                tickFormatter={(v: number) => fmt(v, 0)}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={44}
              />

              {objetivoVisible && (
                <ReferenceLine
                  y={objetivoVisible}
                  stroke="var(--accent-500)"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  label={{
                    value: `Objetivo ${fmt(objetivoVisible, 1)} kg`,
                    position: "insideBottomLeft",
                    fontSize: 11,
                    fontWeight: 600,
                    fill: "var(--accent-600)",
                  }}
                />
              )}

              <RechartsTooltip
                content={<TooltipEvolucion serie={serie} />}
                cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
              />

              {/* Lineal y no suavizada: entre dos mediciones no hay datos, y la
                  curva "monotone" inventa picos cuando dos tomas caen juntas. */}
              <Area type="linear" dataKey="valor" stroke="none" fill="url(#relleno-evolucion)" isAnimationActive={false} />
              <Line
                type="linear"
                dataKey="valor"
                stroke="var(--primary)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4, strokeWidth: 2, stroke: "var(--card)", fill: "var(--primary)" }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--card)", fill: "var(--primary)" }}
                isAnimationActive={false}
              >
                {/* Solo el ultimo punto lleva su valor escrito: el resto vive
                    en el tooltip y en la tabla del registro. */}
                <LabelList
                  dataKey="valor"
                  content={({ x, y, value, index }) =>
                    index === puntos.length - 1 ? (
                      <text
                        x={Number(x) + 10}
                        y={Number(y) + 4}
                        fontSize={12}
                        fontWeight={700}
                        fill="var(--foreground)"
                      >
                        {fmt(Number(value), config.decimales)}
                      </text>
                    ) : null
                  }
                />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function Cifra({
  etiqueta,
  valor,
  detalle,
  icono: Icono,
}: {
  etiqueta: string;
  valor: string;
  detalle: string;
  icono?: typeof Target;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{etiqueta}</p>
      <p className="text-foreground mt-0.5 flex items-center gap-1.5 text-2xl font-semibold tracking-tight tabular-nums">
        {Icono && <Icono className="text-muted-foreground size-5" aria-hidden />}
        {valor}
      </p>
      <p className="text-muted-foreground mt-0.5 text-xs">{detalle}</p>
    </div>
  );
}

function TooltipEvolucion({
  serie,
  active,
  payload,
}: {
  serie: Serie;
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: Punto }>;
}) {
  const punto = payload?.[0]?.payload;
  if (!active || !punto) return null;
  const config = SERIES[serie];

  return (
    <div className="bg-popover text-popover-foreground min-w-36 rounded-lg border border-border px-3 py-2 shadow-overlay">
      {/* El valor manda; la fecha y el cambio lo acompañan. Sin clave de
          color: hay una sola serie, y una raya junto al numero se leia como
          signo negativo ("— 78 kg"). */}
      <p className="text-foreground text-base font-semibold tabular-nums">
        {fmt(punto.valor, config.decimales)} {config.unidad}
      </p>
      <p className="text-muted-foreground mt-0.5 text-xs">
        {formatearInstante(punto.iso, { day: "numeric", month: "long", year: "numeric" })}
      </p>
      {punto.cambio !== null && Math.abs(punto.cambio) >= 0.05 && (
        <p className="text-muted-foreground mt-1 border-t border-border pt-1 text-xs tabular-nums">
          {punto.cambio > 0 ? "+" : "−"}
          {fmt(Math.abs(punto.cambio), config.decimales)} {config.unidad} vs la anterior
        </p>
      )}
      {serie === "imc" && (
        <p className="text-muted-foreground text-xs">{categoriaImc(punto.valor).etiqueta}</p>
      )}
    </div>
  );
}
