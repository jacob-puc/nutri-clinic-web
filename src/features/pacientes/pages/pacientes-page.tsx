import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDownAZ, ArrowUpAZ, Search, UserPlus, X } from "lucide-react";

import { AccionesPaciente } from "@/features/pacientes/components/acciones-paciente";
import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import { DialogoPaciente } from "@/features/pacientes/components/dialogo-paciente";
import { usePacientes } from "@/features/pacientes/hooks/use-pacientes";
import { EstadoError } from "@/components/states/estado-error";
import { EstadoVacio } from "@/components/states/estado-vacio";
import { SkeletonTabla } from "@/components/states/skeleton-tabla";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipSimple } from "@/components/ui/tooltip-simple";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mensajeDeError } from "@/lib/api-error";
import { etiquetaSexo, formatearFechaCorta, normalizar } from "@/lib/formatters";
import type { Paciente } from "@/types/api";

export function PacientesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [altaAbierta, setAltaAbierta] = useState(false);

  const busqueda = searchParams.get("busqueda") ?? "";
  /* El orden vive en la URL junto a la búsqueda: en estado local se perdía
     al refrescar, con lo que el listado volvía siempre a A-Z sin aviso. */
  const ascendente = searchParams.get("orden") !== "desc";
  /* replace: cada pulsacion reemplaza la entrada del historial. Sin esto,
     escribir "ana" deja tres pasos atras y rompe la flecha del navegador. */
  const cambiarBusqueda = (valor: string) => {
    setSearchParams(
      (actuales) => {
        if (valor.trim()) {
          actuales.set("busqueda", valor);
        } else {
          actuales.delete("busqueda");
        }
        return actuales;
      },
      { replace: true },
    );
  };

  const cambiarOrden = () => {
    setSearchParams(
      (actuales) => {
        if (ascendente) {
          actuales.set("orden", "desc");
        } else {
          actuales.delete("orden");
        }
        return actuales;
      },
      { replace: true },
    );
  };

  const { data, isPending, isError, error, refetch } = usePacientes();

  const termino = normalizar(busqueda);

  const pacientes = useMemo(() => {
    const lista = data ?? [];

    const filtrados = termino
      ? lista.filter((paciente) => normalizar(paciente.nombreCompleto).includes(termino))
      : lista;

    return [...filtrados].sort((a, b) => {
      const comparacion = a.nombreCompleto.localeCompare(
        b.nombreCompleto,
        "es",
        { sensitivity: "base" },
      );
      return ascendente ? comparacion : -comparacion;
    });
  }, [data, termino, ascendente]);

  const hayDatos = (data?.length ?? 0) > 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <EncabezadoPacientes total={data?.length ?? 0} onNuevo={() => setAltaAbierta(true)} />

      <DialogoPaciente abierto={altaAbierta} onOpenChange={setAltaAbierta} />

      {/* Barra de filtros sobre el fondo, sin caja propia: una tarjeta aqui
          era una capa mas de "card dentro de pagina" sin informacion. */}
      <div className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                aria-hidden
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                type="search"
                value={busqueda}
                onChange={(evento) => cambiarBusqueda(evento.target.value)}
                placeholder="Buscar por nombre..."
                aria-label="Buscar paciente por nombre"
                className="bg-card shadow-subtle h-10 pl-9 pr-9"
              />
              {busqueda && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => cambiarBusqueda("")}
                  aria-label="Limpiar búsqueda"
                  className="text-muted-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2"
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={cambiarOrden}
              className="h-10 shrink-0"
              aria-label={
                ascendente ? "Ordenar de Z a A" : "Ordenar de A a Z"
              }
            >
              {ascendente ? (
                <ArrowDownAZ className="size-4" />
              ) : (
                <ArrowUpAZ className="size-4" />
              )}
              <span className="hidden sm:inline">
                {ascendente ? "A - Z" : "Z - A"}
              </span>
            </Button>
          </div>

          {!isPending && !isError && hayDatos && (
            <p className="text-muted-foreground mt-3 text-sm" aria-live="polite">
              {pacientes.length === data?.length
                ? `${pacientes.length} ${pacientes.length === 1 ? "paciente" : "pacientes"} activos`
                : `${pacientes.length} de ${data?.length} pacientes`}
            </p>
          )}
      </div>

      <div className="mt-4">
        {isPending && (
          <SkeletonTabla
            anchos={["w-56", "w-40", "w-32", "w-16", "w-20", "w-12"]}
            filas={6}
            conAvatar
          />
        )}

        {!isPending && isError && (
          <EstadoError
            titulo="No pudimos cargar los pacientes"
            mensaje={mensajeDeError(error)}
            onReintentar={refetch}
          />
        )}

        {!isPending && !isError && !hayDatos && (
          <EstadoVacio
            titulo="Todavía no hay pacientes"
            descripcion="La clínica todavía no tiene pacientes activos registrados. Cuando se dé de alta el primero, aparecerá aquí."
            visual={
              <AvatarPaciente nombre="Paciente" id="vacio" className="size-14" />
            }
          >
            <Button variant="outline" onClick={() => refetch()} className="mt-1">
              Actualizar
            </Button>
          </EstadoVacio>
        )}

        {!isPending && !isError && hayDatos && pacientes.length === 0 && (
          <EstadoVacio
            icono={Search}
            titulo="Sin coincidencias"
            descripcion={
              <>
                Ningún paciente coincide con{" "}
                <span className="text-foreground font-medium">
                  "{busqueda}"
                </span>
                .
              </>
            }
          >
            <Button
              variant="outline"
              onClick={() => cambiarBusqueda("")}
              className="mt-1"
            >
              Limpiar búsqueda
            </Button>
          </EstadoVacio>
        )}

        {!isPending && !isError && pacientes.length > 0 && (
          <TablaPacientes pacientes={pacientes} />
        )}
      </div>
    </div>
  );
}

function EncabezadoPacientes({
  total,
  onNuevo,
}: {
  total: number;
  onNuevo: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
      <div className="flex items-center gap-3">
        <h1 className="font-editorial text-foreground text-3xl font-normal tracking-tight md:text-4xl">
          Pacientes
        </h1>
        <span className="bg-primary-soft text-primary-soft-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums">
          {total} {total === 1 ? "activo" : "activos"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={onNuevo}>
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">Nuevo paciente</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>
    </div>
  );
}

function TablaPacientes({ pacientes }: { pacientes: Paciente[] }) {
  return (
    <div className="hoja overflow-hidden rounded-[1.25rem]">
      <Table>
        <caption className="sr-only">Pacientes activos de la clínica</caption>

        <TableHeader>
          <TableRow className="bg-surface-subtle/70 hover:bg-surface-subtle/70">
            <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium md:px-6">
              Paciente
            </TableHead>
            <TableHead className="text-muted-foreground hidden px-4 py-3 text-xs font-medium lg:table-cell">
              Contacto
            </TableHead>
            <TableHead className="text-muted-foreground hidden px-4 py-3 text-xs font-medium md:table-cell">
              Nacimiento
            </TableHead>
            <TableHead className="text-muted-foreground hidden px-4 py-3 text-xs font-medium sm:table-cell">
              Edad
            </TableHead>
            <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium md:px-6">
              Sexo
            </TableHead>
            {/* Columna de acciones: sin etiqueta visible, pero se conserva
                la celda de encabezado para que el numero de columnas siga
                cuadrando con las de cada fila. */}
            <TableHead className="w-12 py-3 pr-3 pl-0 md:pr-4">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {pacientes.map((paciente) => (
            <FilaPaciente key={paciente.id} paciente={paciente} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function FilaPaciente({ paciente }: { paciente: Paciente }) {
  return (
    <TableRow className="hover:bg-accent">
      {/* whitespace-normal en las dos primeras celdas: contienen texto con
          truncate, que necesita poder comprimirse. El resto conserva el
          nowrap por defecto de TableCell, que es lo que quieren fechas y
          numeros. */}
      <TableCell className="px-4 py-3 whitespace-normal md:px-6">
        <Link
          to={`/pacientes/${paciente.id}`}
          className="-mx-2 flex items-center gap-3 rounded-md px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AvatarPaciente nombre={paciente.nombreCompleto} id={paciente.id} />
          <div className="min-w-0">
            <p className="text-foreground flex min-w-0 items-center gap-1.5 font-medium">
              <span className="truncate">{paciente.nombreCompleto}</span>
              {paciente.datosPorCompletar && <InsigniaPorCompletar />}
            </p>
            {/* En movil las columnas ocultas se sustituyen por estas lineas. */}
            <p className="text-muted-foreground truncate text-xs lg:hidden">
              {paciente.correoElectronico}
            </p>
            <p className="text-muted-foreground truncate text-xs lg:hidden">
              {formatearFechaCorta(paciente.fechaNacimiento)}
              {paciente.edad !== null && ` · ${paciente.edad} años`}
            </p>
          </div>
        </Link>
      </TableCell>
      <TableCell className="hidden px-4 py-3 whitespace-normal lg:table-cell">
        <p className="truncate">{paciente.correoElectronico}</p>
        <p className="text-muted-foreground truncate text-xs">
          {paciente.telefono}
        </p>
      </TableCell>
      <TableCell className="text-muted-foreground hidden px-4 py-3 md:table-cell">
        {formatearFechaCorta(paciente.fechaNacimiento)}
      </TableCell>
      <TableCell className="text-muted-foreground hidden px-4 py-3 tabular-nums sm:table-cell">
        {paciente.edad !== null ? `${paciente.edad}` : "—"}
      </TableCell>
      <TableCell className="px-4 py-3 md:px-6">
        <Badge variant="outline">{etiquetaSexo(paciente.sexo)}</Badge>
      </TableCell>
      {/* El menu de acciones es la unica accion disponible, asi que esta
          columna NO se oculta en movil: es la que sobrevive al colapso. */}
      <TableCell className="w-12 py-3 pr-3 pl-0 text-right md:pr-4">
        <AccionesPaciente paciente={paciente} />
      </TableCell>
    </TableRow>
  );
}

function InsigniaPorCompletar() {
  return (
    <TooltipSimple contenido="Se registró al reservar en línea: revisa y completa sus datos">
      <span className="bg-warning-soft text-warning-soft-foreground shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
        Por completar
      </span>
    </TooltipSimple>
  );
}
