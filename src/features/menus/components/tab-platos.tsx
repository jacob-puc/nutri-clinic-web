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
  useAlimentos,
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
  /* Las fotos de los ingredientes arman la portada de cada plato. */
  const alimentos = useAlimentos();
  const imagenes = useMemo(
    () => new Map((alimentos.data ?? []).filter((a) => a.imagenUrl).map((a) => [a.id, a.imagenUrl as string])),
    [alimentos.data],
  );

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

      {consulta.isPending && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      )}

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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {platos.map((plato) => (
            <li key={plato.id}>
              <TarjetaPlato
                plato={plato}
                imagenes={imagenes}
                onEditar={() => setEditando(plato)}
                onDuplicar={() => duplicarPlato(plato)}
                onEliminar={() => setEliminando(plato)}
                onRestaurar={() => restaurarPlato(plato)}
              />
            </li>
          ))}
        </ul>
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

/* ---------------- Tarjeta de plato ---------------- */

function TarjetaPlato({
  plato,
  imagenes,
  onEditar,
  onDuplicar,
  onEliminar,
  onRestaurar,
}: {
  plato: Plato;
  imagenes: Map<string, string>;
  onEditar: () => void;
  onDuplicar: () => void;
  onEliminar: () => void;
  onRestaurar: () => void;
}) {
  const ingredientes = [...plato.detalles].sort((a, b) => a.orden - b.orden);

  return (
    <article
      className={cn(
        "hoja group relative flex h-full flex-col overflow-hidden rounded-xl transition-shadow",
        plato.isActive ? "hover:shadow-[0_14px_30px_-20px_rgb(0_0_0/0.35)]" : "opacity-60",
      )}
    >
      <div className="relative">
        <PortadaPlato plato={plato} imagenes={imagenes} />
        <span className="bg-card/90 text-foreground absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums shadow-sm backdrop-blur">
          {formatearKcal(plato.caloriasTotales)}
        </span>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="bg-card/85 hover:bg-card size-8 rounded-full shadow-sm backdrop-blur"
                aria-label={`Acciones de ${plato.nombre}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {plato.isActive ? (
                <>
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
        </div>
      </div>

      <button
        type="button"
        onClick={plato.isActive ? onEditar : undefined}
        disabled={!plato.isActive}
        className="focus-visible:ring-ring flex flex-1 flex-col gap-3 p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset"
      >
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-foreground font-semibold leading-snug">{plato.nombre}</h3>
            {!plato.isActive && <span className="text-destructive text-xs">Eliminado</span>}
          </div>
          {esVariante(plato) && (
            <span className="bg-primary-soft text-primary-soft-foreground inline-block rounded px-1.5 py-px text-[10px] font-semibold">
              {plato.descripcion}
            </span>
          )}
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {ingredientes
              .map((d) =>
                d.medidaTexto
                  ? `${d.alimentoNombre} ${d.medidaTexto} (${formatearNumero(d.racionGramos)} g)`
                  : `${d.alimentoNombre} ${formatearNumero(d.racionGramos)} g`,
              )
              .join(" · ")}
          </p>
        </div>
        <div className="mt-auto">
          <LineaMacros
            macros={{
              calorias: plato.caloriasTotales,
              proteinas: plato.proteinasTotales,
              carbohidratos: plato.carbohidratosTotales,
              grasas: plato.grasasTotales,
            }}
            conBarra
          />
        </div>
      </button>
    </article>
  );
}

/**
 * Portada: la foto del plato si tiene; si no, un mosaico con las fotos de sus
 * ingredientes (hasta cuatro). Sin ninguna foto, un fondo de marca con icono.
 */
function PortadaPlato({ plato, imagenes }: { plato: Plato; imagenes: Map<string, string> }) {
  const fotos = plato.imagenUrl
    ? [plato.imagenUrl]
    : [...plato.detalles]
        .sort((a, b) => a.orden - b.orden)
        .map((d) => imagenes.get(d.alimentoId))
        .filter((u): u is string => Boolean(u))
        .slice(0, 4);

  if (fotos.length === 0) {
    /* Sin fotos: el color del macro que mas energia aporta, para que cada
       plato se distinga a simple vista (los ingredientes van abajo). */
    const energia = [
      { macro: "Proteína", color: "var(--chart-1)", kcal: plato.proteinasTotales * 4 },
      { macro: "Carbohidratos", color: "var(--chart-2)", kcal: plato.carbohidratosTotales * 4 },
      { macro: "Grasas", color: "var(--chart-3)", kcal: plato.grasasTotales * 9 },
    ];
    const dominante = energia.reduce((max, m) => (m.kcal > max.kcal ? m : max), energia[0]!);
    return (
      <div
        className="relative flex aspect-[16/10] flex-col justify-end overflow-hidden p-3"
        style={{
          backgroundImage: `radial-gradient(120% 90% at 100% 0%, color-mix(in oklch, ${dominante.color} 28%, transparent), transparent 70%), linear-gradient(160deg, color-mix(in oklch, ${dominante.color} 10%, var(--color-card)), var(--color-card))`,
        }}
      >
        <UtensilsCrossed
          aria-hidden
          strokeWidth={1.25}
          className="absolute -right-4 -bottom-6 size-32 -rotate-12 opacity-[0.14]"
          style={{ color: dominante.color }}
        />
        <p
          className="bg-card/85 w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase shadow-sm"
          style={{ color: dominante.color }}
        >
          Alto en {dominante.macro.toLowerCase()}
        </p>
      </div>
    );
  }

  const disposicion =
    fotos.length === 1
      ? "grid-cols-1"
      : fotos.length === 2
        ? "grid-cols-2"
        : fotos.length === 3
          ? "grid-cols-2 grid-rows-2 [&>*:first-child]:row-span-2"
          : "grid-cols-2 grid-rows-2";

  return (
    <div className={cn("bg-muted grid aspect-[16/10] gap-0.5", disposicion)}>
      {fotos.map((url, i) => (
        <img
          key={`${url}-${i}`}
          src={url}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ))}
    </div>
  );
}
