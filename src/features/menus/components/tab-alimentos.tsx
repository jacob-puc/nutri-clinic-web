import { useMemo, useState } from "react";
import { Apple, MoreHorizontal, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { ImagenAlimento } from "@/features/menus/components/imagen-alimento";
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
  ConfirmarEliminacion,
  LineaMacros,
  type FiltroVigencia,
} from "@/features/menus/components/comunes";
import { DialogoAlimento } from "@/features/menus/components/dialogo-alimento";
import {
  useAlimentos,
  useEliminarAlimento,
  useRestaurarAlimento,
} from "@/features/menus/hooks/use-menus";
import { formatearKcal } from "@/features/menus/lib/menus";
import { mensajeDeError } from "@/lib/api-error";
import { normalizar } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Alimento } from "@/types/api";

export function TabAlimentos() {
  const [busqueda, setBusqueda] = useState("");
  const [vigencia, setVigencia] = useState<FiltroVigencia>("vigentes");
  const [editando, setEditando] = useState<Alimento | null>(null);
  const [creando, setCreando] = useState(false);
  const [eliminando, setEliminando] = useState<Alimento | null>(null);

  const consulta = useAlimentos({ soloActivos: vigencia === "vigentes", ordenarPor: "nombre" });
  const eliminar = useEliminarAlimento();
  const restaurar = useRestaurarAlimento();

  const termino = normalizar(busqueda);
  const alimentos = useMemo(
    () => (consulta.data ?? []).filter((a) => normalizar(a.nombre).includes(termino)),
    [consulta.data, termino],
  );

  const restaurarAlimento = (alimento: Alimento) =>
    restaurar.mutate(alimento.id, {
      onSuccess: () => toast.success("Alimento restaurado", { description: alimento.nombre }),
      onError: (error) => toast.error("No se pudo restaurar", { description: mensajeDeError(error) }),
    });

  const hayDatos = (consulta.data?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <BarraHerramientas
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        placeholder="Buscar alimento..."
        vigencia={vigencia}
        onVigencia={setVigencia}
        accion={
          <Button onClick={() => setCreando(true)}>
            <Plus className="size-4" />
            Nuevo alimento
          </Button>
        }
      />

      {consulta.isPending && <SkeletonTabla anchos={["w-48", "w-20", "w-56", "w-12"]} filas={6} />}

      {consulta.isError && (
        <EstadoError
          titulo="No pudimos cargar los alimentos"
          mensaje={mensajeDeError(consulta.error)}
          onReintentar={consulta.refetch}
        />
      )}

      {consulta.isSuccess && !hayDatos && (
        <EstadoVacio
          icono={Apple}
          titulo="El catálogo de alimentos está vacío"
          descripcion="Los platos se arman con alimentos de este catálogo. Agrega el primero con sus valores por 100 g."
        >
          <Button onClick={() => setCreando(true)} className="mt-1">
            <Plus className="size-4" />
            Agregar alimento
          </Button>
        </EstadoVacio>
      )}

      {consulta.isSuccess && hayDatos && alimentos.length === 0 && (
        <EstadoVacio icono={Search} titulo="Sin coincidencias" descripcion={`Ningún alimento coincide con "${busqueda}".`} />
      )}

      {alimentos.length > 0 && (
        <div className="hoja overflow-hidden rounded-[1.25rem]">
          <Table>
            <caption className="sr-only">Catálogo de alimentos</caption>
            <TableHeader>
              <TableRow className="bg-surface-subtle/70 hover:bg-surface-subtle/70">
                <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium md:px-6">Alimento</TableHead>
                <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium">Energía / 100 g</TableHead>
                <TableHead className="text-muted-foreground hidden px-4 py-3 text-xs font-medium sm:table-cell">Macros / 100 g</TableHead>
                <TableHead className="w-12 py-3 pr-3 pl-0 md:pr-4">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alimentos.map((alimento) => (
                <TableRow key={alimento.id} className={cn("hover:bg-accent", !alimento.isActive && "opacity-60")}>
                  <TableCell className="px-4 py-3 whitespace-normal md:px-6">
                    <div className="flex items-center gap-3">
                      <ImagenAlimento url={alimento.imagenUrl} nombre={alimento.nombre} />
                      <div className="min-w-0">
                        <p className="text-foreground font-medium">{alimento.nombre}</p>
                        {!alimento.isActive && <p className="text-destructive text-xs">Eliminado</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-semibold tabular-nums">{formatearKcal(alimento.calorias)}</TableCell>
                  <TableCell className="hidden px-4 py-3 sm:table-cell">
                    <LineaMacros macros={alimento} conBarra />
                  </TableCell>
                  <TableCell className="w-12 py-3 pr-3 pl-0 text-right md:pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={`Acciones de ${alimento.nombre}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {alimento.isActive ? (
                          <>
                            <DropdownMenuItem onSelect={() => setEditando(alimento)}>
                              <Pencil />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => setEliminando(alimento)}>
                              <Trash2 />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onSelect={() => restaurarAlimento(alimento)}>
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

      <DialogoAlimento abierto={creando} onOpenChange={setCreando} />
      <DialogoAlimento abierto={editando !== null} onOpenChange={(a) => !a && setEditando(null)} alimento={editando} />

      <ConfirmarEliminacion
        abierto={eliminando !== null}
        onOpenChange={(a) => !a && setEliminando(null)}
        titulo={`¿Eliminar ${eliminando?.nombre ?? "el alimento"}?`}
        descripcion="Deja de aparecer al armar platos nuevos. Los platos que ya lo usan conservan sus macros y puedes restaurarlo después."
        onConfirmar={async () => {
          if (!eliminando) return;
          await eliminar.mutateAsync(eliminando.id);
          toast.success("Alimento eliminado", { description: eliminando.nombre });
        }}
      />
    </div>
  );
}
