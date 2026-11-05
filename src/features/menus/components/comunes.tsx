import { useState, type ReactNode } from "react";
import { CheckCircle2, FilePen, Lock, Search, X } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmentado } from "@/components/ui/segmentado";
import { formatearGramos, formatearKcal, type Macros } from "@/features/menus/lib/menus";
import { mensajeDeError } from "@/lib/api-error";
import { esConflicto } from "@/lib/errores-formulario";
import { cn } from "@/lib/utils";
import type { MenuAsignadoEstado } from "@/types/api";

/* ---------- Estado del plan ---------- */

const ESTILO_ESTADO: Record<MenuAsignadoEstado, { clase: string; icono: typeof Lock }> = {
  Borrador: { clase: "bg-muted text-muted-foreground", icono: FilePen },
  Activo: { clase: "bg-success-soft text-success-soft-foreground", icono: CheckCircle2 },
  Finalizado: { clase: "bg-primary-soft text-primary-soft-foreground", icono: Lock },
};

export function BadgeEstadoPlan({ estado }: { estado: MenuAsignadoEstado }) {
  const { clase, icono: Icono } = ESTILO_ESTADO[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        clase,
      )}
    >
      <Icono className="size-3" aria-hidden />
      {estado}
    </span>
  );
}

/* ---------- Macros ---------- */

/**
 * Proteinas, carbohidratos y grasas en una linea. La barra muestra cuanto
 * aporta cada macro a la energia (4/4/9 kcal por gramo), que es lo que se
 * compara de un vistazo entre platos.
 */
export function LineaMacros({
  macros,
  conBarra = false,
  grueso = false,
}: {
  macros: Macros;
  conBarra?: boolean;
  /** Barra mas alta y a todo el ancho disponible. */
  grueso?: boolean;
}) {
  const energia = {
    p: macros.proteinas * 4,
    c: macros.carbohidratos * 4,
    g: macros.grasas * 9,
  };
  const total = energia.p + energia.c + energia.g;

  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs tabular-nums">
        <span className="text-[var(--chart-1)] font-semibold">P</span> {formatearGramos(macros.proteinas)}
        {" · "}
        <span className="text-[var(--chart-2)] font-semibold">C</span> {formatearGramos(macros.carbohidratos)}
        {" · "}
        <span className="text-[var(--chart-3)] font-semibold">G</span> {formatearGramos(macros.grasas)}
      </p>
      {conBarra && total > 0 && (
        <div className={cn("bg-muted mt-1.5 flex w-full overflow-hidden rounded-full", grueso ? "h-2.5" : "h-1.5 max-w-44")} aria-hidden>
          <span className="bg-[var(--chart-1)]" style={{ width: `${(energia.p / total) * 100}%` }} />
          <span className="bg-[var(--chart-2)]" style={{ width: `${(energia.c / total) * 100}%` }} />
          <span className="bg-[var(--chart-3)]" style={{ width: `${(energia.g / total) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

/**
 * Promedio diario frente al objetivo. Se tolera un 10 % de desvio antes de
 * marcarlo: un menu real nunca cuadra a la caloria.
 */
export function CaloriasVsObjetivo({
  calorias,
  objetivo,
}: {
  calorias: number | null;
  objetivo: number | null;
}) {
  if (calorias === null) {
    return <span className="text-muted-foreground text-sm">Sin platos</span>;
  }

  const desvio = objetivo ? (calorias - objetivo) / objetivo : null;
  const fuera = desvio !== null && Math.abs(desvio) > 0.1;

  return (
    <div className="leading-tight">
      <p className="text-foreground text-sm font-semibold tabular-nums">{formatearKcal(calorias)}</p>
      {objetivo ? (
        <p
          className={cn(
            "text-xs tabular-nums",
            fuera ? "text-warning-soft-foreground" : "text-muted-foreground",
          )}
        >
          {desvio! >= 0 ? "+" : "−"}
          {Math.abs(Math.round(desvio! * 100))}% vs {formatearKcal(objetivo)}
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">Sin objetivo</p>
      )}
    </div>
  );
}

/** Desvio aceptado frente al objetivo: un menu real nunca cuadra a la caloria. */
export const TOLERANCIA_OBJETIVO = 0.1;

/** Promedio diario contra el objetivo: la marca es la meta y la barra lo planeado. */
export function MedidorCalorias({
  calorias,
  objetivo,
  grueso = false,
}: {
  calorias: number | null;
  objetivo: number | null;
  /** Barra mas alta, para cuando el medidor es la cifra principal del bloque. */
  grueso?: boolean;
}) {
  if (calorias === null) return <p className="text-muted-foreground text-sm">Sin platos todavía</p>;

  const desvio = objetivo ? (calorias - objetivo) / objetivo : null;
  const fuera = desvio !== null && Math.abs(desvio) > TOLERANCIA_OBJETIVO;
  /* La escala llega a 150 % de la meta: la marca siempre queda en el mismo lugar. */
  const escala = objetivo ? objetivo * 1.5 : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-foreground text-sm font-semibold tabular-nums">
          {formatearKcal(calorias)}
          <span className="text-muted-foreground font-normal"> /día</span>
        </p>
        <p className={cn("text-xs tabular-nums", fuera ? "text-warning-soft-foreground" : "text-muted-foreground")}>
          {desvio === null
            ? "Sin objetivo"
            : !fuera
              ? "En objetivo"
              : `${Math.abs(Math.round(desvio * 100))}% ${desvio > 0 ? "arriba" : "abajo"} de ${formatearKcal(objetivo)}`}
        </p>
      </div>
      {objetivo && (
        <div className="relative mt-1.5" aria-hidden>
          <div className={cn("bg-surface-muted overflow-hidden rounded-full", grueso ? "h-2.5" : "h-1.5")}>
            <div
              className={cn("barra-gpu h-full w-full origin-left rounded-full", fuera ? "bg-warning" : "bg-primary")}
              style={{ transform: `scaleX(${Math.min(1, calorias / escala)})` }}
            />
          </div>
          <span className={cn("bg-foreground absolute -top-0.5 left-2/3 w-0.5 rounded-full", grueso ? "h-3.5" : "h-2.5")} />
        </div>
      )}
    </div>
  );
}

/* ---------- Barra de herramientas de cada pestaña ---------- */

export type FiltroVigencia = "vigentes" | "todos";

export function BarraHerramientas({
  busqueda,
  onBusqueda,
  placeholder,
  vigencia,
  onVigencia,
  children,
  accion,
}: {
  busqueda: string;
  onBusqueda: (valor: string) => void;
  placeholder: string;
  vigencia: FiltroVigencia;
  onVigencia: (valor: FiltroVigencia) => void;
  /** Filtros extra entre la busqueda y la accion principal. */
  children?: ReactNode;
  accion: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          value={busqueda}
          onChange={(evento) => onBusqueda(evento.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="bg-card shadow-subtle h-10 pr-9 pl-9"
        />
        {busqueda && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onBusqueda("")}
            aria-label="Limpiar búsqueda"
            className="text-muted-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {children}
        <Segmentado
          variante="chips"
          aria-label="Mostrar registros"
          value={vigencia}
          onChange={onVigencia}
          opciones={[
            { valor: "vigentes", etiqueta: "Vigentes" },
            { valor: "todos", etiqueta: "Incluir eliminados" },
          ]}
        />
        {accion}
      </div>
    </div>
  );
}

/* ---------- Confirmacion de borrado ---------- */

/**
 * Confirmacion de borrado logico. Si el backend responde con conflicto y la
 * entidad admite `forzar` (las plantillas en uso), el dialogo no se cierra:
 * muestra el motivo y ofrece eliminar de todos modos.
 */
export function ConfirmarEliminacion({
  abierto,
  onOpenChange,
  titulo,
  descripcion,
  onConfirmar,
  permiteForzar = false,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  titulo: string;
  descripcion: ReactNode;
  onConfirmar: (forzar: boolean) => Promise<unknown>;
  permiteForzar?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [requiereForzar, setRequiereForzar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cambiarApertura = (siguiente: boolean) => {
    if (!siguiente) {
      setError(null);
      setRequiereForzar(false);
    }
    onOpenChange(siguiente);
  };

  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await onConfirmar(requiereForzar);
      cambiarApertura(false);
    } catch (fallo) {
      setError(mensajeDeError(fallo));
      if (permiteForzar && esConflicto(fallo) && !requiereForzar) setRequiereForzar(true);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AlertDialog open={abierto} onOpenChange={cambiarApertura}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={enviando}
            className="bg-destructive border-destructive/80 hover:bg-destructive/90 text-white"
            onClick={(evento) => {
              evento.preventDefault();
              void confirmar();
            }}
          >
            {enviando ? "Eliminando..." : requiereForzar ? "Eliminar de todos modos" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
