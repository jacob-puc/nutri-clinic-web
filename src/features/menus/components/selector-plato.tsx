import { useMemo, useState } from "react";
import { AlertTriangle, Heart, Plus, Search, ThumbsDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Segmentado } from "@/components/ui/segmentado";
import { encaja, evaluarPlato, type PerfilAlimentario } from "@/features/menus/lib/compatibilidad";
import { formatearKcal } from "@/features/menus/lib/menus";
import { normalizar } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Guid, Plato } from "@/types/api";

type Vista = "compatibles" | "todos";

/**
 * Buscador de platos para una comida concreta. En vez de una lista
 * alfabetica, ordena por lo que mejor completa esa comida: primero lo que
 * cabe en las calorias que faltan, con prioridad a lo que le gusta al
 * paciente. Los platos con alguno de sus alergenos quedan bloqueados.
 *
 * "Compatibles" esconde lo que no encaja o no le gusta; "Todos" muestra el
 * catalogo completo, igual de ordenado.
 */
export function SelectorPlato({
  platos,
  excluidos,
  presupuesto,
  perfil,
  etiqueta,
  onElegir,
}: {
  platos: Plato[];
  /** Ya presentes en esta comida: el backend no admite repetirlos. */
  excluidos: Set<Guid>;
  /** Calorias que faltan en esta comida; null si no hay objetivo. */
  presupuesto: number | null;
  perfil?: PerfilAlimentario;
  etiqueta: string;
  onElegir: (platoId: Guid) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const hayCriterio = presupuesto !== null || perfil !== undefined;
  const [vista, setVista] = useState<Vista>(hayCriterio ? "compatibles" : "todos");

  const evaluados = useMemo(() => {
    const termino = normalizar(busqueda);
    return platos
      .filter((p) => !excluidos.has(p.id))
      .filter(
        (p) =>
          !termino ||
          normalizar(p.nombre).includes(termino) ||
          p.detalles.some((d) => normalizar(d.alimentoNombre).includes(termino)),
      )
      .map((plato) => {
        const evaluacion = evaluarPlato(plato, perfil);
        const cabe = encaja(plato.caloriasTotales, presupuesto);
        /* Menor puntaje = mas arriba. */
        const distancia =
          presupuesto !== null && presupuesto > 0 ? Math.abs(plato.caloriasTotales - presupuesto) / presupuesto : 0;
        const puntaje =
          (evaluacion.alergenos.length > 0 ? 100 : 0) +
          (evaluacion.noGusta.length > 0 ? 10 : 0) +
          (presupuesto !== null && !cabe ? 5 : 0) +
          distancia -
          (evaluacion.gusta.length > 0 ? 0.5 : 0);
        return { plato, evaluacion, cabe, puntaje };
      })
      .sort((a, b) => a.puntaje - b.puntaje || a.plato.nombre.localeCompare(b.plato.nombre, "es"));
  }, [platos, excluidos, busqueda, perfil, presupuesto]);

  const visibles =
    vista === "compatibles"
      ? evaluados.filter(
          (e) =>
            e.evaluacion.alergenos.length === 0 &&
            e.evaluacion.noGusta.length === 0 &&
            (presupuesto === null || e.cabe),
        )
      : evaluados;

  const elegir = (platoId: Guid) => {
    onElegir(platoId);
    setAbierto(false);
    setBusqueda("");
  };

  return (
    /* modal: el selector vive dentro del dialogo del plan, pero su contenido
       se monta en un portal fuera de el. Sin modal, el bloqueo de scroll y la
       trampa de foco del dialogo lo tratan como algo ajeno: la lista no hace
       scroll y el buscador no recibe el foco, y la edicion se queda trabada. */
    <Popover open={abierto} onOpenChange={setAbierto} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={platos.length === 0}
          aria-label={`Agregar plato a ${etiqueta}`}
          className="border-muted-foreground/40 text-muted-foreground hover:border-primary/60 hover:text-foreground inline-flex h-8 w-full items-center gap-1.5 rounded-lg border border-dashed px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <Plus className="size-3.5" aria-hidden />
          {platos.length === 0 ? "No hay platos activos" : "Agregar plato"}
          {presupuesto !== null && presupuesto > 0 && (
            <span className="text-muted-foreground-subtle font-normal">· faltan {formatearKcal(presupuesto)}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(26rem,calc(100vw-2rem))] p-0">
        <div className="space-y-2 border-b p-3">
          <div className="relative">
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            />
            <Input
              autoFocus
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar plato o ingrediente…"
              className="h-9 pl-8 text-sm"
            />
          </div>
          {hayCriterio && (
            <Segmentado
              variante="chips"
              aria-label="Qué platos mostrar"
              value={vista}
              onChange={setVista}
              opciones={[
                { valor: "compatibles", etiqueta: "Compatibles" },
                { valor: "todos", etiqueta: "Todos" },
              ]}
            />
          )}
        </div>

        <ul className="max-h-72 overflow-y-auto p-1.5" role="listbox" aria-label={`Platos para ${etiqueta}`}>
          {visibles.length === 0 && (
            <li className="text-muted-foreground px-3 py-6 text-center text-sm">
              {vista === "compatibles" ? (
                <>
                  Ningún plato compatible.{" "}
                  <button type="button" className="text-primary font-medium underline" onClick={() => setVista("todos")}>
                    Ver todos
                  </button>
                </>
              ) : (
                "Sin coincidencias."
              )}
            </li>
          )}
          {visibles.map(({ plato, evaluacion, cabe }) => {
            const bloqueado = evaluacion.alergenos.length > 0;
            return (
              <li key={plato.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  disabled={bloqueado}
                  onClick={() => elegir(plato.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                    bloqueado ? "cursor-not-allowed opacity-60" : "hover:bg-accent",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground block truncate text-sm font-medium">{plato.nombre}</span>
                    <span className="mt-0.5 flex flex-wrap gap-1">
                      {bloqueado && (
                        <Etiqueta tono="peligro" icono={AlertTriangle}>
                          Alérgeno: {evaluacion.alergenos.join(", ")}
                        </Etiqueta>
                      )}
                      {evaluacion.noGusta.length > 0 && (
                        <Etiqueta tono="aviso" icono={ThumbsDown}>
                          No le gusta: {evaluacion.noGusta.join(", ")}
                        </Etiqueta>
                      )}
                      {evaluacion.gusta.length > 0 && (
                        <Etiqueta tono="exito" icono={Heart}>
                          Le gusta
                        </Etiqueta>
                      )}
                      {presupuesto !== null && cabe && !bloqueado && <Etiqueta tono="marca">Encaja</Etiqueta>}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      presupuesto !== null && !cabe ? "text-warning-soft-foreground" : "text-foreground",
                    )}
                  >
                    {formatearKcal(plato.caloriasTotales)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

const TONOS = {
  peligro: "bg-destructive-soft text-destructive-soft-foreground",
  aviso: "bg-warning-soft text-warning-soft-foreground",
  exito: "bg-success-soft text-success-soft-foreground",
  marca: "bg-primary-soft text-primary-soft-foreground",
} as const;

function Etiqueta({
  tono,
  icono: Icono,
  children,
}: {
  tono: keyof typeof TONOS;
  icono?: typeof Heart;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-px text-[11px] font-medium", TONOS[tono])}>
      {Icono && <Icono className="size-3" aria-hidden />}
      {children}
    </span>
  );
}
