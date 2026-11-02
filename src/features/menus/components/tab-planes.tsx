import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
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
import { Segmentado } from "@/components/ui/segmentado";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import {
  BadgeEstadoPlan,
  BarraHerramientas,
  CaloriasVsObjetivo,
  ConfirmarEliminacion,
  type FiltroVigencia,
} from "@/features/menus/components/comunes";
import { DialogoAsignarPlan } from "@/features/menus/components/dialogo-asignar-plan";
import { DialogoDuplicarPlan } from "@/features/menus/components/dialogo-duplicar-plan";
import { DialogoPlan } from "@/features/menus/components/dialogo-plan";
import {
  useEliminarMenuAsignado,
  useMenusAsignados,
  useRestaurarMenuAsignado,
} from "@/features/menus/hooks/use-menus";
import { ESTADOS_PLAN, promedioDiario } from "@/features/menus/lib/menus";
import { mensajeDeError } from "@/lib/api-error";
import { abrirPdfConAviso } from "@/lib/pdf";
import { menusApi } from "@/features/menus/api/menus-api";
import { formatearFechaCorta, normalizar } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { MenuAsignado, MenuAsignadoEstado } from "@/types/api";

type FiltroEstado = MenuAsignadoEstado | "todos";

export function TabPlanes() {
  const [busqueda, setBusqueda] = useState("");
  const [vigencia, setVigencia] = useState<FiltroVigencia>("vigentes");
  const [estado, setEstado] = useState<FiltroEstado>("todos");
  const [asignando, setAsignando] = useState(false);
  const [abierto, setAbierto] = useState<MenuAsignado | null>(null);
  const [duplicando, setDuplicando] = useState<MenuAsignado | null>(null);
  const [eliminando, setEliminando] = useState<MenuAsignado | null>(null);

  const consulta = useMenusAsignados({
    soloActivos: vigencia === "vigentes",
    estado: estado === "todos" ? undefined : estado,
    ordenarPor: "fechainicio",
    descendente: true,
  });
  const eliminar = useEliminarMenuAsignado();
  const restaurar = useRestaurarMenuAsignado();

  const termino = normalizar(busqueda);
  const planes = useMemo(
    () =>
      (consulta.data ?? []).filter(
        (p) => normalizar(p.pacienteNombre).includes(termino) || normalizar(p.nombre).includes(termino),
      ),
    [consulta.data, termino],
  );

  const restaurarPlan = (plan: MenuAsignado) =>
    restaurar.mutate(plan.id, {
      onSuccess: () => toast.success("Plan restaurado", { description: plan.nombre }),
      onError: (error) => toast.error("No se pudo restaurar", { description: mensajeDeError(error) }),
    });

  const hayDatos = (consulta.data?.length ?? 0) > 0;
  const filtrando = estado !== "todos" || vigencia !== "vigentes";

  return (
    <div className="space-y-4">
      <BarraHerramientas
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        placeholder="Buscar por paciente o plan..."
        vigencia={vigencia}
        onVigencia={setVigencia}
        accion={
          <Button onClick={() => setAsignando(true)}>
            <Plus className="size-4" />
            Asignar plan
          </Button>
        }
      >
        <Segmentado
          variante="chips"
          aria-label="Filtrar por estado"
          value={estado}
          onChange={setEstado}
          opciones={[
            { valor: "todos", etiqueta: "Todos" },
            ...ESTADOS_PLAN.map((e) => ({ valor: e, etiqueta: e })),
          ]}
        />
      </BarraHerramientas>

      {consulta.isPending && (
        <SkeletonTabla anchos={["w-56", "w-24", "w-20", "w-28", "w-12"]} filas={6} conAvatar />
      )}

      {consulta.isError && (
        <EstadoError
          titulo="No pudimos cargar los planes"
          mensaje={mensajeDeError(consulta.error)}
          onReintentar={consulta.refetch}
        />
      )}

      {consulta.isSuccess && !hayDatos && (
        <EstadoVacio
          icono={ClipboardCheck}
          titulo={filtrando ? "No hay planes con este filtro" : "Ningún paciente tiene plan todavía"}
          descripcion={
            filtrando
              ? "Prueba con otro estado o incluye los eliminados."
              : "Elige un paciente y una plantilla semanal; el plan se copia y lo ajustas a su medida."
          }
        >
          {!filtrando && (
            <Button onClick={() => setAsignando(true)} className="mt-1">
              <Plus className="size-4" />
              Asignar plan
            </Button>
          )}
        </EstadoVacio>
      )}

      {consulta.isSuccess && hayDatos && planes.length === 0 && (
        <EstadoVacio icono={Search} titulo="Sin coincidencias" descripcion={`Ningún plan coincide con "${busqueda}".`} />
      )}

      {planes.length > 0 && (
        <div className="hoja overflow-hidden rounded-xl">
          <Table>
            <caption className="sr-only">Planes nutricionales de pacientes</caption>
            <TableHeader>
              <TableRow className="bg-surface-subtle/70 hover:bg-surface-subtle/70">
                <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium md:px-6">Paciente</TableHead>
                <TableHead className="text-muted-foreground hidden px-4 py-3 text-xs font-medium md:table-cell">Inicio</TableHead>
                <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium">Estado</TableHead>
                <TableHead className="text-muted-foreground hidden px-4 py-3 text-xs font-medium sm:table-cell">Promedio diario</TableHead>
                <TableHead className="w-12 py-3 pr-3 pl-0 md:pr-4">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planes.map((plan) => {
                const editable = plan.isActive && plan.estado !== "Finalizado";
                return (
                  <TableRow
                    key={plan.id}
                    className={cn("hover:bg-accent cursor-pointer", !plan.isActive && "opacity-60")}
                    onClick={() => setAbierto(plan)}
                  >
                    <TableCell className="px-4 py-3 whitespace-normal md:px-6">
                      <div className="flex items-center gap-3">
                        <AvatarPaciente nombre={plan.pacienteNombre} id={plan.pacienteId} />
                        <div className="min-w-0">
                          <Link
                            to={`/pacientes/${plan.pacienteId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-foreground truncate font-medium hover:underline"
                          >
                            {plan.pacienteNombre}
                          </Link>
                          <p className="text-muted-foreground truncate text-xs">
                            {plan.nombre}
                            {!plan.isActive && <span className="text-destructive"> · eliminado</span>}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden px-4 py-3 md:table-cell">
                      {formatearFechaCorta(plan.fechaInicio)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <BadgeEstadoPlan estado={plan.estado} />
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 sm:table-cell">
                      <CaloriasVsObjetivo calorias={promedioDiario(plan.detalles)} objetivo={plan.objetivoCalorico} />
                    </TableCell>
                    <TableCell className="w-12 py-3 pr-3 pl-0 text-right md:pr-4" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground"
                            aria-label={`Acciones del plan de ${plan.pacienteNombre}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onSelect={() => setAbierto(plan)}>
                            {editable ? <Pencil /> : <Eye />}
                            {editable ? "Editar" : "Ver plan"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => abrirPdfConAviso(() => menusApi.abrirMenuPdf(plan.id))}>
                            <Printer />
                            Imprimir menú
                          </DropdownMenuItem>
                          {plan.isActive && (
                            <DropdownMenuItem onSelect={() => setDuplicando(plan)}>
                              <Copy />
                              Duplicar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {plan.isActive ? (
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={plan.estado === "Activo"}
                              onSelect={() => setEliminando(plan)}
                            >
                              <Trash2 />
                              {plan.estado === "Activo" ? "Finalízalo para eliminar" : "Eliminar"}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => restaurarPlan(plan)}>
                              <RotateCcw />
                              Restaurar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <DialogoAsignarPlan abierto={asignando} onOpenChange={setAsignando} />
      <DialogoPlan abierto={abierto !== null} onOpenChange={(a) => !a && setAbierto(null)} plan={abierto} />
      <DialogoDuplicarPlan
        plan={duplicando}
        onOpenChange={(a) => !a && setDuplicando(null)}
        onDuplicado={(copia) => setAbierto(copia)}
      />

      <ConfirmarEliminacion
        abierto={eliminando !== null}
        onOpenChange={(a) => !a && setEliminando(null)}
        titulo={`¿Eliminar el plan de ${eliminando?.pacienteNombre ?? "este paciente"}?`}
        descripcion="Sale del listado de planes vigentes. Puedes restaurarlo después desde «Incluir eliminados»."
        onConfirmar={async () => {
          if (!eliminando) return;
          await eliminar.mutateAsync(eliminando.id);
          toast.success("Plan eliminado", { description: eliminando.nombre });
        }}
      />
    </div>
  );
}
