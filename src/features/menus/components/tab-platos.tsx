import { useMemo, useState } from "react";
import {
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UtensilsCrossed,
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
  ConfirmarEliminacion,
  LineaMacros,
  type FiltroVigencia,
} from "@/features/menus/components/comunes";
import { DialogoPlato } from "@/features/menus/components/dialogo-plato";
import {
  useDuplicarPlato,
  useEliminarPlato,
  usePlatos,
  useRestaurarPlato,
} from "@/features/menus/hooks/use-menus";
import { formatearKcal, formatearNumero } from "@/features/menus/lib/menus";
import { esVariante } from "@/features/menus/lib/variantes";
import { mensajeDeError } from "@/lib/api-error";
import { normalizar } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Plato } from "@/types/api";

export function TabPlatos() {
  const [busqueda, setBusqueda] = useState("");
  const [vigencia, setVigencia] = useState<FiltroVigencia>("vigentes");
  const [editando, setEditando] = useState<Plato | null>(null);
  const [creando, setCreando] = useState(false);
  const [eliminando, setEliminando] = useState<Plato | null>(null);

  const consulta = usePlatos({ soloActivos: vigencia === "vigentes", ordenarPor: "nombre" });
  const duplicar = useDuplicarPlato();
  const eliminar = useEliminarPlato();
  const restaurar = useRestaurarPlato();

  /* La busqueda tambien mira los ingredientes: "avena" encuentra todos los
     platos que la llevan, no solo los que la tienen en el nombre. */
  const termino = normalizar(busqueda);
  const platos = useMemo(
    () =>
      (consulta.data ?? []).filter(
        (p) =>
          normalizar(p.nombre).includes(termino) ||
          p.detalles.some((d) => normalizar(d.alimentoNombre).includes(termino)),
      ),
    [consulta.data, termino],
  );

  const duplicarPlato = (plato: Plato) =>
    duplicar.mutate(
      { platoId: plato.id, dto: { nombre: `${plato.nombre} (copia)` } },
      {
        onSuccess: (copia) => {
          toast.success("Plato duplicado", { description: copia.nombre });
          setEditando(copia);
        },
        onError: (error) => toast.error("No se pudo duplicar", { description: mensajeDeError(error) }),
      },
    );

  const restaurarPlato = (plato: Plato) =>
    restaurar.mutate(plato.id, {
      onSuccess: () => toast.success("Plato restaurado", { description: plato.nombre }),
      onError: (error) => toast.error("No se pudo restaurar", { description: mensajeDeError(error) }),
    });

  const hayDatos = (consulta.data?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <BarraHerramientas
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        placeholder="Buscar plato o ingrediente..."
        vigencia={vigencia}
        onVigencia={setVigencia}
        accion={
          <Button onClick={() => setCreando(true)}>
            <Plus className="size-4" />
            Nuevo plato
          </Button>
        }
      />

      {consulta.isPending && <SkeletonTabla anchos={["w-64", "w-20", "w-48", "w-12"]} filas={6} />}

      {consulta.isError && (
        <EstadoError
          titulo="No pudimos cargar los platos"
          mensaje={mensajeDeError(consulta.error)}
          onReintentar={consulta.refetch}
        />
      )}

      {consulta.isSuccess && !hayDatos && (
        <EstadoVacio
          icono={UtensilsCrossed}
          titulo="Todavía no hay platos"
          descripcion="Un plato combina alimentos del catálogo con su ración. Después lo usas para armar plantillas semanales."
        >
          <Button onClick={() => setCreando(true)} className="mt-1">
            <Plus className="size-4" />
            Crear plato
          </Button>
        </EstadoVacio>
      )}

      {consulta.isSuccess && hayDatos && platos.length === 0 && (
        <EstadoVacio icono={Search} titulo="Sin coincidencias" descripcion={`Ningún plato coincide con "${busqueda}".`} />
      )}

      {platos.length > 0 && (
        <div className="hoja overflow-hidden rounded-xl">
          <Table>
            <caption className="sr-only">Platos</caption>
            <TableHeader>
              <TableRow className="bg-surface-subtle/70 hover:bg-surface-subtle/70">
                <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium md:px-6">Plato</TableHead>
                <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium">Energía</TableHead>
                <TableHead className="text-muted-foreground hidden px-4 py-3 text-xs font-medium md:table-cell">Macros</TableHead>
                <TableHead className="w-12 py-3 pr-3 pl-0 md:pr-4">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platos.map((plato) => (
                <TableRow key={plato.id} className={cn("hover:bg-accent", !plato.isActive && "opacity-60")}>
                  <TableCell className="px-4 py-3 whitespace-normal md:px-6">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-medium">{plato.nombre}</p>
                      {!plato.isActive && <span className="text-destructive text-xs">Eliminado</span>}
                      {esVariante(plato) && (
                        <span className="bg-primary-soft text-primary-soft-foreground rounded px-1.5 py-px text-[10px] font-semibold">
                          {plato.descripcion}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                      {[...plato.detalles]
                        .sort((a, b) => a.orden - b.orden)
                        .map((d) => `${d.alimentoNombre} ${formatearNumero(d.racionGramos)} g`)
                        .join(" · ")}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-semibold tabular-nums">{formatearKcal(plato.caloriasTotales)}</TableCell>
                  <TableCell className="hidden px-4 py-3 md:table-cell">
                    <LineaMacros
                      macros={{
                        calorias: plato.caloriasTotales,
                        proteinas: plato.proteinasTotales,
                        carbohidratos: plato.carbohidratosTotales,
                        grasas: plato.grasasTotales,
                      }}
                      conBarra
                    />
                  </TableCell>
                  <TableCell className="w-12 py-3 pr-3 pl-0 text-right md:pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={`Acciones de ${plato.nombre}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {plato.isActive ? (
                          <>
                            <DropdownMenuItem onSelect={() => setEditando(plato)}>
                              <Pencil />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => duplicarPlato(plato)}>
                              <Copy />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => setEliminando(plato)}>
                              <Trash2 />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onSelect={() => restaurarPlato(plato)}>
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

      <DialogoPlato abierto={creando} onOpenChange={setCreando} />
      <DialogoPlato abierto={editando !== null} onOpenChange={(a) => !a && setEditando(null)} plato={editando} />

      <ConfirmarEliminacion
        abierto={eliminando !== null}
        onOpenChange={(a) => !a && setEliminando(null)}
        titulo={`¿Eliminar ${eliminando?.nombre ?? "el plato"}?`}
        descripcion="No se puede eliminar si está en una plantilla o en el plan activo de un paciente; en ese caso quítalo de ahí primero."
        onConfirmar={async () => {
          if (!eliminando) return;
          await eliminar.mutateAsync(eliminando.id);
          toast.success("Plato eliminado", { description: eliminando.nombre });
        }}
      />
    </div>
  );
}
