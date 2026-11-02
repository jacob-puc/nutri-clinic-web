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
import { SkeletonTabla } from "@/components/states/skeleton-tabla";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { DIAS_SEMANA, ETIQUETA_DIA, ETIQUETA_DIA_CORTA, promedioDiario } from "@/features/menus/lib/menus";
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

      {consulta.isPending && <SkeletonTabla anchos={["w-64", "w-40", "w-28", "w-12"]} filas={5} />}

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
        <div className="hoja overflow-hidden rounded-xl">
          <Table>
            <caption className="sr-only">Plantillas semanales</caption>
            <TableHeader>
              <TableRow className="bg-surface-subtle/70 hover:bg-surface-subtle/70">
                <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium md:px-6">Plantilla</TableHead>
                <TableHead className="text-muted-foreground hidden px-4 py-3 text-xs font-medium md:table-cell">Semana</TableHead>
                <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium">Promedio diario</TableHead>
                <TableHead className="w-12 py-3 pr-3 pl-0 md:pr-4">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plantillas.map((plantilla) => (
                <TableRow
                  key={plantilla.id}
                  className={cn("hover:bg-accent", !plantilla.isActive && "opacity-60", plantilla.isActive && "cursor-pointer")}
                  onClick={() => plantilla.isActive && setEditando(plantilla)}
                >
                  <TableCell className="px-4 py-3 whitespace-normal md:px-6">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-medium">{plantilla.nombre}</p>
                      {!plantilla.isActive && <span className="text-destructive text-xs">Eliminada</span>}
                    </div>
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                      {plantilla.descripcion ?? `${plantilla.detalles.length} platos en la semana`}
                    </p>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 md:table-cell">
                    <DiasCubiertos plantilla={plantilla} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <CaloriasVsObjetivo calorias={promedioDiario(plantilla.detalles)} objetivo={plantilla.objetivoCalorico} />
                  </TableCell>
                  <TableCell className="w-12 py-3 pr-3 pl-0 text-right md:pr-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={`Acciones de ${plantilla.nombre}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        {plantilla.isActive ? (
                          <>
                            <DropdownMenuItem onSelect={() => setAsignando(plantilla)} disabled={plantilla.detalles.length === 0}>
                              <ClipboardCheck />
                              Asignar a paciente
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setEditando(plantilla)}>
                              <Pencil />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => duplicarPlantilla(plantilla)}>
                              <Copy />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => setEliminando(plantilla)}>
                              <Trash2 />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onSelect={() => restaurarPlantilla(plantilla)}>
                            <RotateCcw />
                            Restaurar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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

/** Siete puntos, uno por dia: lleno si ese dia tiene platos. */
function DiasCubiertos({ plantilla }: { plantilla: PlantillaMenu }) {
  return (
    <div className="flex gap-1">
      {DIAS_SEMANA.map((dia) => {
        const lleno = plantilla.detalles.some((d) => d.diaSemana === dia);
        return (
          <span
            key={dia}
            aria-label={`${ETIQUETA_DIA[dia]}: ${lleno ? "con platos" : "vacío"}`}
            className={cn(
              "grid size-6 place-items-center rounded-md text-[10px] font-semibold",
              lleno ? "bg-primary-soft text-primary-soft-foreground" : "bg-muted text-muted-foreground-subtle",
            )}
          >
            {ETIQUETA_DIA_CORTA[dia].charAt(0)}
          </span>
        );
      })}
    </div>
  );
}
