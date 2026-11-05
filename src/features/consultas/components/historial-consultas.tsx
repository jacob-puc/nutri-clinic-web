import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Search, X } from "lucide-react";

import { Seccion } from "@/components/ficha/seccion";
import { Button } from "@/components/ui/button";
import { FiltroPeriodo } from "@/components/ui/filtro-periodo";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatearHoraLocal } from "@/features/citas/lib/fechas-cita";
import { BadgeTipoConsulta } from "@/features/consultas/components/badge-tipo-consulta";
import { useConsultas } from "@/features/consultas/hooks/use-consultas";
import { ETIQUETA_TIPO_CONSULTA } from "@/features/consultas/lib/etiquetas-consulta";
import { useNutricionistasQueAtienden } from "@/features/nutricionistas/hooks/use-nutricionistas";
import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import { usePeriodoUrl } from "@/hooks/use-periodo-url";
import { formatearInstante } from "@/lib/zona-horaria";
import type { ConsultaFiltro, Guid, TipoConsulta } from "@/types/api";

const TODOS = "todos";
const TIPOS = Object.keys(ETIQUETA_TIPO_CONSULTA) as TipoConsulta[];

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Consultas ya terminadas. Abre en las de hoy, que son las que se revisan en
 * el dia a dia; el periodo y los filtros sirven para buscar las anteriores.
 */
export function HistorialConsultas() {
  const { periodo, rango, cambiar } = usePeriodoUrl("dia");
  const [tipo, setTipo] = useState<TipoConsulta | typeof TODOS>(TODOS);
  const [nutricionista, setNutricionista] = useState<Guid | typeof TODOS>(TODOS);
  const [busqueda, setBusqueda] = useState("");

  const nutricionistas = useNutricionistasQueAtienden();

  const filtro = useMemo<ConsultaFiltro>(
    () => ({
      desde: rango.desde,
      hasta: rango.hasta,
      ...(tipo !== TODOS && { tipoConsulta: tipo }),
      ...(nutricionista !== TODOS && { nutricionistaId: nutricionista }),
    }),
    [rango.desde, rango.hasta, tipo, nutricionista],
  );
  const consultas = useConsultas(filtro);

  const texto = normalizar(busqueda.trim());
  const terminadas = useMemo(
    () =>
      (consultas.data ?? [])
        .filter((c) => c.fechaFin && (!texto || normalizar(c.pacienteNombre).includes(texto)))
        .sort((a, b) => b.fechaFin!.localeCompare(a.fechaFin!)),
    [consultas.data, texto],
  );

  const conFiltros = tipo !== TODOS || nutricionista !== TODOS || texto !== "";
  const limpiar = () => {
    setTipo(TODOS);
    setNutricionista(TODOS);
    setBusqueda("");
  };

  return (
    <Seccion
      titulo="Historial"
      icono={CheckCircle2}
      meta={terminadas.length === 1 ? "1 consulta" : `${terminadas.length} consultas`}
    >
      <div className="mb-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_10rem_12rem_15rem_auto]">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar paciente"
              aria-label="Buscar paciente"
              className="h-10 pl-9"
            />
          </div>

          <Select value={tipo} onValueChange={(valor) => setTipo(valor as TipoConsulta | typeof TODOS)}>
            <SelectTrigger className="w-full data-[size=default]:h-10" aria-label="Tipo de consulta">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los tipos</SelectItem>
              {TIPOS.map((t) => (
                <SelectItem key={t} value={t}>
                  {ETIQUETA_TIPO_CONSULTA[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={nutricionista} onValueChange={setNutricionista}>
            <SelectTrigger className="w-full data-[size=default]:h-10" aria-label="Nutricionista">
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

          <FiltroPeriodo periodo={periodo} onChange={cambiar} className="sm:w-full" />

          <Button type="button" variant="ghost" className="h-10" disabled={!conFiltros} onClick={limpiar}>
            <X className="size-4" />
            Limpiar
          </Button>
        </div>
      </div>

      {consultas.isPending ? (
        <div className="space-y-3" aria-busy="true">
          <span className="sr-only">Cargando historial...</span>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : consultas.isError ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-muted-foreground text-sm">No pudimos cargar el historial.</p>
          <Button variant="outline" size="sm" onClick={() => void consultas.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : terminadas.length === 0 ? (
        <p className="text-muted-foreground py-2 text-sm">
          {conFiltros
            ? "Ninguna consulta terminada coincide con los filtros."
            : periodo.tipo === "dia" && rango.esActual
              ? "Hoy todavía no termina ninguna consulta."
              : "Sin consultas terminadas en este periodo."}
        </p>
      ) : (
        <ul className="divide-border/60 divide-y">
          {terminadas.map((consulta) => (
            <li key={consulta.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <div className="w-20 shrink-0 tabular-nums">
                <p className="text-foreground text-sm font-semibold">
                  {formatearHoraLocal(consulta.fechaFin!)}
                </p>
                {!rango.esUnDia && (
                  <p className="text-muted-foreground text-xs">
                    {formatearInstante(consulta.fechaFin, { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
              <AvatarPaciente nombre={consulta.pacienteNombre} id={consulta.pacienteId} className="size-9 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link
                    to={`/pacientes/${consulta.pacienteId}`}
                    className="text-foreground focus-visible:ring-ring rounded-sm text-sm font-semibold outline-none hover:underline focus-visible:ring-2"
                  >
                    {consulta.pacienteNombre}
                  </Link>
                  <BadgeTipoConsulta tipo={consulta.tipoConsulta} />
                </div>
                <p className="text-muted-foreground truncate text-xs">
                  {consulta.nutricionistaNombre}
                  {consulta.notasClinicas && ` · ${consulta.notasClinicas}`}
                </p>
              </div>
              <Button size="sm" variant="outline" asChild className="ml-auto shrink-0">
                <Link to={`/consultas/${consulta.id}`}>Ver consulta</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Seccion>
  );
}
