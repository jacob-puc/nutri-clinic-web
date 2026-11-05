import { useMemo, useState } from "react";
import {
  CalendarRange,
  ClipboardCheck,
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { EstadoError } from "@/components/states/estado-error";
import { EstadoVacio } from "@/components/states/estado-vacio";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarraHerramientas,
  CaloriasVsObjetivo,
  ConfirmarEliminacion,
  type FiltroVigencia,
} from "@/features/menus/components/comunes";
import { DialogoAsignarPlan } from "@/features/menus/components/dialogo-asignar-plan";
import { DialogoPlantilla } from "@/features/menus/components/dialogo-plantilla";
import {
  useDuplicarPlantillaMenu,
  useEliminarPlantillaMenu,
  usePlantillasMenu,
  useRestaurarPlantillaMenu,
} from "@/features/menus/hooks/use-menus";
import { DIAS_SEMANA, ETIQUETA_DIA, ETIQUETA_DIA_CORTA, ETIQUETA_TIEMPO, TIEMPOS_COMIDA, promedioDiario } from "@/features/menus/lib/menus";
import { mensajeDeError } from "@/lib/api-error";
import { normalizar } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { PlantillaMenu } from "@/types/api";

export function TabPlantillas() {
  const [busqueda, setBusqueda] = useState("");
  const [vigencia, setVigencia] = useState<FiltroVigencia>("vigentes");
  const [editando, setEditando] = useState<PlantillaMenu | null>(null);
  const [creando, setCreando] = useState(false);
  const [eliminando, setEliminando] = useState<PlantillaMenu | null>(null);
  const [asignando, setAsignando] = useState<PlantillaMenu | null>(null);

  const consulta = usePlantillasMenu({ soloActivos: vigencia === "vigentes", ordenarPor: "nombre" });
  const duplicar = useDuplicarPlantillaMenu();
  const eliminar = useEliminarPlantillaMenu();
  const restaurar = useRestaurarPlantillaMenu();

  const termino = normalizar(busqueda);
  const plantillas = useMemo(
    () => (consulta.data ?? []).filter((p) => normalizar(p.nombre).includes(termino)),
    [consulta.data, termino],
  );

  const duplicarPlantilla = (plantilla: PlantillaMenu) =>
    duplicar.mutate(
      { plantillaId: plantilla.id, dto: { nombre: `${plantilla.nombre} (copia)` } },
      {
        onSuccess: (copia) => {
          toast.success("Plantilla duplicada", { description: copia.nombre });
          setEditando(copia);
        },
        onError: (error) => toast.error("No se pudo duplicar", { description: mensajeDeError(error) }),
      },
    );

  const restaurarPlantilla = (plantilla: PlantillaMenu) =>
    restaurar.mutate(plantilla.id, {
      onSuccess: () => toast.success("Plantilla restaurada", { description: plantilla.nombre }),
      onError: (error) => toast.error("No se pudo restaurar", { description: mensajeDeError(error) }),
    });

  const hayDatos = (consulta.data?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <BarraHerramientas
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        placeholder="Buscar plantilla..."
        vigencia={vigencia}
        onVigencia={setVigencia}
        accion={
          <Button onClick={() => setCreando(true)}>
            <Plus className="size-4" />
            Nueva plantilla
          </Button>
        }
      />

      {consulta.isPending && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      )}

      {consulta.isError && (
        <EstadoError
          titulo="No pudimos cargar las plantillas"
          mensaje={mensajeDeError(consulta.error)}
          onReintentar={consulta.refetch}
        />
      )}

      {consulta.isSuccess && !hayDatos && (
        <EstadoVacio
          icono={CalendarRange}
          titulo="Todavía no hay plantillas"
          descripcion="Una plantilla es un menú de siete días que reutilizas: se copia a cada paciente y ahí se ajusta."
        >
          <Button onClick={() => setCreando(true)} className="mt-1">
            <Plus className="size-4" />
            Crear plantilla
          </Button>
        </EstadoVacio>
      )}

      {consulta.isSuccess && hayDatos && plantillas.length === 0 && (
        <EstadoVacio icono={Search} titulo="Sin coincidencias" descripcion={`Ninguna plantilla coincide con "${busqueda}".`} />
      )}

      {plantillas.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plantillas.map((plantilla) => (
            <li key={plantilla.id} className="anim-entrada tarjeta-viva">
              <TarjetaPlantilla
                plantilla={plantilla}
                onAsignar={() => setAsignando(plantilla)}
                onEditar={() => setEditando(plantilla)}
                onDuplicar={() => duplicarPlantilla(plantilla)}
                onEliminar={() => setEliminando(plantilla)}
                onRestaurar={() => restaurarPlantilla(plantilla)}
              />
            </li>
          ))}
        </ul>
      )}

      <DialogoPlantilla abierto={creando} onOpenChange={setCreando} />
      <DialogoPlantilla abierto={editando !== null} onOpenChange={(a) => !a && setEditando(null)} plantilla={editando} />
      <DialogoAsignarPlan
        abierto={asignando !== null}
        onOpenChange={(a) => !a && setAsignando(null)}
        plantillaInicial={asignando?.id}
      />

      <ConfirmarEliminacion
        abierto={eliminando !== null}
        onOpenChange={(a) => !a && setEliminando(null)}
        titulo={`¿Eliminar ${eliminando?.nombre ?? "la plantilla"}?`}
        descripcion="Deja de aparecer al asignar planes nuevos. Los planes que ya se crearon con ella no cambian."
        permiteForzar
        onConfirmar={async (forzar) => {
          if (!eliminando) return;
          await eliminar.mutateAsync({ plantillaId: eliminando.id, forzar });
          toast.success("Plantilla eliminada", { description: eliminando.nombre });
        }}
      />
    </div>
  );
}

/* ---------------- Tarjeta de plantilla ---------------- */

function TarjetaPlantilla({
  plantilla,
  onAsignar,
  onEditar,
  onDuplicar,
  onEliminar,
  onRestaurar,
}: {
  plantilla: PlantillaMenu;
  onAsignar: () => void;
  onEditar: () => void;
  onDuplicar: () => void;
  onEliminar: () => void;
  onRestaurar: () => void;
}) {
  const vacia = plantilla.detalles.length === 0;
  const dias = new Set(plantilla.detalles.map((d) => d.diaSemana)).size;

  return (
    <article
      className={cn(
        "hoja flex h-full flex-col rounded-[1.25rem]",
        !plantilla.isActive && "opacity-60",
      )}
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-5">
        <button
          type="button"
          onClick={plantilla.isActive ? onEditar : undefined}
          disabled={!plantilla.isActive}
          className="focus-visible:ring-ring min-w-0 rounded-md text-left outline-none focus-visible:ring-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-foreground font-semibold leading-snug">{plantilla.nombre}</h3>
            {!plantilla.isActive && <span className="text-destructive text-xs">Eliminada</span>}
          </div>
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
            {plantilla.descripcion ?? `${plantilla.detalles.length} platos · ${dias} de 7 días`}
          </p>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground -mt-1 -mr-2 shrink-0" aria-label={`Acciones de ${plantilla.nombre}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {plantilla.isActive ? (
              <>
                <DropdownMenuItem onSelect={onAsignar} disabled={vacia}>
                  <ClipboardCheck />
                  Asignar a paciente
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onEditar}>
                  <Pencil />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onDuplicar}>
                  <Copy />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onEliminar}>
                  <Trash2 />
                  Eliminar
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onSelect={onRestaurar}>
                <RotateCcw />
                Restaurar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="px-5 pt-4 pb-4">
        <MiniSemana plantilla={plantilla} />
      </div>

      <footer className="border-border-strong mt-auto flex items-center justify-between gap-3 border-t border-dashed px-5 py-4">
        <CaloriasVsObjetivo calorias={promedioDiario(plantilla.detalles)} objetivo={plantilla.objetivoCalorico} />
        {plantilla.isActive && (
          <Button variant="outline" size="sm" onClick={onAsignar} disabled={vacia} className="shrink-0">
            <ClipboardCheck className="size-4" />
            Asignar
          </Button>
        )}
      </footer>
    </article>
  );
}

/**
 * Vista previa de la semana: una columna por dia y una fila por tiempo de
 * comida. Cada casilla se llena con la intensidad de cuantos platos tiene.
 */
function MiniSemana({ plantilla }: { plantilla: PlantillaMenu }) {
  const conteo = new Map<string, number>();
  for (const d of plantilla.detalles) {
    const clave = `${d.diaSemana}|${d.tiempoComida}`;
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
  }
  /* Solo los tiempos que se usan en alguna plantilla de la semana; si esta
     vacia, los cuatro principales para que se lea como calendario. */
  const usados = TIEMPOS_COMIDA.filter((t) => plantilla.detalles.some((d) => d.tiempoComida === t));
  const filas = usados.length > 0 ? usados : TIEMPOS_COMIDA.slice(0, 4);

  return (
    <div className="grid grid-cols-[4.75rem_repeat(7,minmax(0,1fr))] items-center gap-1">
      <span />
      {DIAS_SEMANA.map((dia) => (
        <span key={dia} className="text-muted-foreground text-center text-[10px] font-semibold">
          {ETIQUETA_DIA_CORTA[dia].charAt(0)}
        </span>
      ))}
      {filas.map((tiempo) => (
        <Fila key={tiempo} etiqueta={ETIQUETA_TIEMPO[tiempo]}>
          {DIAS_SEMANA.map((dia) => {
            const n = conteo.get(`${dia}|${tiempo}`) ?? 0;
            return (
              <span
                key={dia}
                aria-label={`${ETIQUETA_DIA[dia]}, ${ETIQUETA_TIEMPO[tiempo]}: ${n === 0 ? "vacío" : `${n} plato${n === 1 ? "" : "s"}`}`}
                className={cn(
                  "h-4 rounded-[4px]",
                  n === 0 ? "bg-muted" : n === 1 ? "bg-primary/45" : "bg-primary/80",
                )}
              />
            );
          })}
        </Fila>
      ))}
    </div>
  );
}

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <>
      <span className="text-muted-foreground truncate pr-1 text-[10px]">{etiqueta}</span>
      {children}
    </>
  );
}
