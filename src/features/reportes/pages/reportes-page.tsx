import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  CreditCard,
  Receipt,
  Stethoscope,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Seccion } from "@/components/ficha/seccion";
import { EstadoError } from "@/components/states/estado-error";
import { EstadoVacio } from "@/components/states/estado-vacio";
import { FiltroPeriodo } from "@/components/ui/filtro-periodo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TarjetaEstadistica } from "@/components/ui/tarjeta-estadistica";
import { ETIQUETA_METODO, formatearMoneda } from "@/features/cobros/lib/cobros";
import { ETIQUETA_TIPO_CONSULTA } from "@/features/consultas/lib/etiquetas-consulta";
import { useNutricionistasQueAtienden } from "@/features/nutricionistas/hooks/use-nutricionistas";
import { usePeriodoUrl } from "@/hooks/use-periodo-url";
import { useParametroUrl } from "@/hooks/use-parametro-url";
import { apiClient } from "@/lib/api-client";
import { mensajeDeError } from "@/lib/api-error";
import { formatearCalendario } from "@/lib/zona-horaria";
import type { AgrupacionReporte, Guid, PuntoIngresos, ReporteIngresos } from "@/types/api";

const TODOS = "todos";

const MONEDA_CORTA = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  notation: "compact",
  maximumFractionDigits: 1,
});

const TITULO_SERIE: Record<AgrupacionReporte, string> = {
  Dia: "Ingresos por día",
  Semana: "Ingresos por semana",
  Mes: "Ingresos por mes",
};

function etiquetaEje(clave: string, agrupacion: AgrupacionReporte, conAnio: boolean) {
  if (agrupacion === "Mes") {
    return formatearCalendario(clave, conAnio ? { month: "short", year: "2-digit" } : { month: "short" });
  }
  return formatearCalendario(clave, { day: "numeric", month: "short" });
}

function etiquetaTramo(clave: string, agrupacion: AgrupacionReporte) {
  if (agrupacion === "Mes") return formatearCalendario(clave, { month: "long", year: "numeric" });
  const dia = formatearCalendario(clave, { day: "numeric", month: "long", year: "numeric" });
  return agrupacion === "Semana" ? `Semana del ${dia}` : dia;
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Frase de comparacion; sin base no hay porcentaje honesto que dar. */
function comparacion(total: number, anterior: number) {
  if (anterior === 0) return total > 0 ? "Sin ingresos previos" : "Igual que antes";
  const cambio = Math.round(((total - anterior) / anterior) * 100);
  if (cambio === 0) return "Igual que antes";
  return `${cambio > 0 ? "+" : ""}${cambio}% vs. anterior`;
}

/** Ingresos de la clinica por periodo, solo para el administrador. */
export function ReportesPage() {
  const { periodo, rango, cambiar } = usePeriodoUrl("mes");
  const [nutricionista, setNutricionista] = useParametroUrl<Guid | typeof TODOS>("nutricionista", TODOS);
  const nutricionistas = useNutricionistasQueAtienden();

  const parametros = useMemo(
    () => ({
      desde: rango.desde,
      hasta: rango.hasta,
      ...(nutricionista !== TODOS && { nutricionistaId: nutricionista }),
    }),
    [rango.desde, rango.hasta, nutricionista],
  );

  const reporte = useQuery({
    queryKey: ["reportes", "ingresos", parametros],
    queryFn: async () => {
      const { data } = await apiClient.get<ReporteIngresos>("/api/reportes/ingresos", { params: parametros });
      return data;
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const datos = reporte.data;
  const sinCobros = datos !== undefined && datos.cobros === 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 md:px-8 md:py-8">
      <div>
        <h1 className="font-editorial text-foreground text-3xl font-normal tracking-tight md:text-4xl">Reportes</h1>
        <p className="text-muted-foreground mt-1 text-sm">Ingresos de la clínica por periodo.</p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <FiltroPeriodo periodo={periodo} onChange={cambiar} />
        <Select value={nutricionista} onValueChange={setNutricionista}>
          <SelectTrigger className="w-full data-[size=default]:h-10 sm:w-56" aria-label="Nutricionista">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todo el equipo</SelectItem>
            {nutricionistas.data?.map((n) => (
              <SelectItem key={n.id} value={n.id}>
                {n.nombreCompleto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {reporte.isError ? (
        <EstadoError
          titulo="No pudimos cargar el reporte"
          mensaje={mensajeDeError(reporte.error)}
          onReintentar={() => void reporte.refetch()}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <TarjetaEstadistica
              destacada
              icono={TrendingUp}
              etiqueta="Ingresos"
              valor={datos ? formatearMoneda(datos.total) : null}
              detalle={datos && comparacion(datos.total, datos.totalAnterior)}
            />
            <TarjetaEstadistica
              icono={Receipt}
              etiqueta="Cobros"
              valor={datos ? datos.cobros : null}
              detalle={datos && (datos.anulados > 0 ? plural(datos.anulados, "anulado", "anulados") : "Sin anulaciones")}
            />
            <TarjetaEstadistica
              icono={Wallet}
              tono="info"
              etiqueta="Ticket promedio"
              valor={datos ? formatearMoneda(datos.ticketPromedio) : null}
              detalle="Por cobro"
            />
            <TarjetaEstadistica
              icono={Stethoscope}
              tono={datos && datos.consultasPorCobrar > 0 ? "aviso" : "exito"}
              etiqueta="Consultas atendidas"
              valor={datos ? datos.consultasAtendidas : null}
              detalle={
                datos &&
                (datos.consultasPorCobrar > 0
                  ? `${datos.consultasPorCobrar} por cobrar`
                  : "Todas cobradas")
              }
              href={datos && datos.consultasPorCobrar > 0 ? "/cobros" : undefined}
            />
          </div>

          {sinCobros ? (
            <EstadoVacio
              icono={BarChart3}
              titulo="Sin ingresos en este periodo"
              descripcion="Prueba con otro periodo o quita el filtro de nutricionista."
            />
          ) : (
            datos && (
              <>
                <Seccion titulo={TITULO_SERIE[datos.agrupacion]} icono={BarChart3} className="anim-vista">
                  <GraficaIngresos serie={datos.serie} agrupacion={datos.agrupacion} />
                </Seccion>

                <div className={`grid gap-4 ${nutricionista === TODOS ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  <Desglose
                    titulo="Por método de pago"
                    icono={CreditCard}
                    total={datos.total}
                    filas={datos.porMetodo.map((m) => ({ ...m, clave: m.metodo, nombre: ETIQUETA_METODO[m.metodo] }))}
                  />
                  {nutricionista === TODOS && (
                    <Desglose
                      titulo="Por nutricionista"
                      icono={Users}
                      total={datos.total}
                      filas={datos.porNutricionista.map((n) => ({ ...n, clave: n.nutricionistaId }))}
                    />
                  )}
                  <Desglose
                    titulo="Por tipo de consulta"
                    icono={UserRound}
                    total={datos.total}
                    filas={datos.porTipoConsulta.map((t) => ({
                      ...t,
                      clave: t.tipo,
                      nombre: ETIQUETA_TIPO_CONSULTA[t.tipo],
                    }))}
                  />
                </div>
              </>
            )
          )}
        </>
      )}
    </div>
  );
}

function GraficaIngresos({ serie, agrupacion }: { serie: PuntoIngresos[]; agrupacion: AgrupacionReporte }) {
  const conAnio = serie.length > 12;
  const eje = { fontSize: 12, fill: "var(--muted-foreground)" };

  return (
    <>
      {/* La llave cambia con el periodo para que las barras vuelvan a crecer. */}
      <div key={`${agrupacion}-${serie[0]?.clave}-${serie.length}`} className="grafica-barras h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serie} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="clave"
              tickFormatter={(clave: string) => etiquetaEje(clave, agrupacion, conAnio)}
              tick={eje}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              minTickGap={20}
            />
            <YAxis
              tickFormatter={(valor: number) => MONEDA_CORTA.format(valor)}
              tick={eje}
              tickLine={false}
              axisLine={false}
              width={60}
              allowDecimals={false}
            />
            <RechartsTooltip
              cursor={{ fill: "var(--accent)" }}
              content={({ active, payload }) => {
                const punto = payload?.[0]?.payload as PuntoIngresos | undefined;
                if (!active || !punto) return null;
                return (
                  <div className="bg-popover text-popover-foreground shadow-overlay rounded-lg border px-3 py-2 text-sm">
                    <p className="text-muted-foreground text-xs first-letter:uppercase">
                      {etiquetaTramo(punto.clave, agrupacion)}
                    </p>
                    <p className="font-semibold tabular-nums">{formatearMoneda(punto.total)}</p>
                    <p className="text-muted-foreground text-xs">{plural(punto.cobros, "cobro", "cobros")}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* La misma informacion para lectores de pantalla. */}
      <table className="sr-only">
        <caption>{TITULO_SERIE[agrupacion]}</caption>
        <tbody>
          {serie.map((punto) => (
            <tr key={punto.clave}>
              <th scope="row">{etiquetaTramo(punto.clave, agrupacion)}</th>
              <td>{formatearMoneda(punto.total)}</td>
              <td>{plural(punto.cobros, "cobro", "cobros")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Desglose({
  titulo,
  icono,
  total,
  filas,
}: {
  titulo: string;
  icono: LucideIcon;
  total: number;
  filas: { clave: string; nombre: string; total: number; cobros: number }[];
}) {
  return (
    <Seccion titulo={titulo} icono={icono}>
      <ul className="space-y-3.5">
        {filas.map((fila) => {
          const parte = total > 0 ? (fila.total / total) * 100 : 0;
          return (
            <li key={fila.clave}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-foreground min-w-0 truncate">{fila.nombre}</span>
                <span className="text-foreground shrink-0 font-semibold tabular-nums">{formatearMoneda(fila.total)}</span>
              </div>
              <div className="bg-surface-muted mt-1.5 h-1.5 overflow-hidden rounded-full">
                <div className="barra-gpu bg-primary h-full w-full origin-left rounded-full" style={{ transform: `scaleX(${parte / 100})` }} />
              </div>
              <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                {Math.round(parte)}% · {plural(fila.cobros, "cobro", "cobros")}
              </p>
            </li>
          );
        })}
      </ul>
    </Seccion>
  );
}
