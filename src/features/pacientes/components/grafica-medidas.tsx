import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { categoriaImc, formatearFechaCorta } from "@/lib/formatters";
import type { MedidaAntropometrica } from "@/types/api";

/**
 * Grafica de evolucion de peso e IMC.
 *
 * El backend ya calcula el IMC, asi que no se recalcula aqui: la grafica
 * solo lo representa. Lo que si hace esta capa es decidir que la grafica
 * tenga sentido: con una sola medicion una linea es un punto suelto que no
 * comunica nada, y en ese caso se cae a la tabla.
 */
const MINIMO_PUNTOS = 2;

interface GraficaMedidasProps {
  medidas: MedidaAntropometrica[];
}

export function GraficaMedidas({ medidas }: GraficaMedidasProps) {
  const datos = useMemo(
    () =>
      [...medidas]
        .sort((a, b) => a.fechaMedicion.localeCompare(b.fechaMedicion))
        .map((medida) => ({
          fecha: formatearFechaCorta(medida.fechaMedicion.slice(0, 10)),
          iso: medida.fechaMedicion,
          peso: medida.peso,
          imc: Number(medida.imc.toFixed(1)),
        })),
    [medidas],
  );

  if (datos.length < MINIMO_PUNTOS) {
    return null;
  }

  return (
    <Card>
      <CardContent className="px-4 py-5 md:px-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-foreground text-sm font-semibold">
            Evolucion de peso e IMC
          </h3>
          <p className="text-muted-foreground text-xs">
            {datos.length} mediciones
          </p>
        </div>

        {/* h-64 fijo: ResponsiveContainer necesita una altura concreta, y sin
            esta el padre colapsa a 0 porque no hay contenido que lo estire. */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />

              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="peso"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                domain={["dataMin - 2", "dataMax + 2"]}
              />
              <YAxis yAxisId="imc" orientation="right" hide domain={[14, 40]} />

              {/* Bandas de la OMS. Se dibujan de fondo (fill) y no como barras
                  porque el objetivo es que se lean como referencia, no como
                  un dato mas de la serie. */}
              <ReferenceArea yAxisId="imc" y1={18.5} y2={25} fill="var(--success)" fillOpacity={0.06} />
              <ReferenceArea yAxisId="imc" y1={25} y2={30} fill="var(--warning)" fillOpacity={0.06} />

              <RechartsTooltip
                content={<TooltipMedidas />}
                cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
              />

              <Line
                yAxisId="peso"
                type="monotone"
                dataKey="peso"
                name="Peso (kg)"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0, fill: "var(--primary)" }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="imc"
                type="monotone"
                dataKey="imc"
                name="IMC"
                stroke="var(--accent-400)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, strokeWidth: 0, fill: "var(--accent-400)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <LeyendaGrafica />
      </CardContent>
    </Card>
  );
}

function TooltipMedidas({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    dataKey?: string | number;
    value?: number | string;
    name?: string;
  }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  const imc = payload.find((p) => p.dataKey === "imc")?.value;

  return (
    <div className="bg-popover text-popover-foreground rounded-lg border border-border px-3 py-2 text-xs shadow-overlay">
      <p className="mb-1 font-semibold">{String(label ?? "")}</p>
      {payload.map((item) => (
        <p key={String(item.dataKey)} className="flex items-center gap-2 tabular-nums">
          <span className="text-muted-foreground">{item.name}:</span>
          <span className="font-medium">{item.value}</span>
        </p>
      ))}
      {typeof imc === "number" && (
        <p className="text-muted-foreground mt-1 border-t border-border pt-1">
          {categoriaImc(imc).etiqueta}
        </p>
      )}
    </div>
  );
}

function LeyendaGrafica() {
  return (
    <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
      <span className="flex items-center gap-1.5">
        <span className="bg-primary inline-block h-0.5 w-4 rounded" />
        Peso (kg)
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-0.5 w-4 rounded"
          style={{ backgroundColor: "var(--accent-400)" }}
        />
        IMC
      </span>
      <span className="flex items-center gap-1.5">
        <span className="bg-success/20 inline-block size-3 rounded-sm" />
        Normal (18.5 - 25)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="bg-warning/20 inline-block size-3 rounded-sm" />
        Sobrepeso (25 - 30)
      </span>
    </div>
  );
}
