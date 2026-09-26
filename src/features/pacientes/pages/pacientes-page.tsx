import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownAZ, ArrowUpAZ, Search, UserPlus, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { AccionesPaciente } from "@/features/pacientes/components/acciones-paciente";
import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import { DialogoPaciente } from "@/features/pacientes/components/dialogo-paciente";
import { usePacientes } from "@/features/pacientes/hooks/use-pacientes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mensajeDeError } from "@/lib/api-error";
import { etiquetaSexo, formatearFechaCorta, normalizar } from "@/lib/formatters";
import type { Paciente } from "@/types/api";

export function PacientesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ascendente, setAscendente] = useState(true);
  const [altaAbierta, setAltaAbierta] = useState(false);

  const busqueda = searchParams.get("busqueda") ?? "";
  const cambiarBusqueda = (valor: string) => {
    setSearchParams((actuales) => {
      if (valor.trim()) {
        actuales.set("busqueda", valor);
      } else {
        actuales.delete("busqueda");
      }
      return actuales;
    });
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

      <Card className="mt-6">
        <CardContent className="px-4 py-4 md:px-6">
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
                className="pl-9 pr-9"
              />
              {busqueda && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => cambiarBusqueda("")}
                  aria-label="Limpiar busqueda"
                  className="text-muted-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2"
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setAscendente((v) => !v)}
              className="shrink-0"
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
        </CardContent>
      </Card>

      <div className="mt-4">
        {isPending && <TablaSkeleton />}

        {!isPending && isError && (
          <EstadoError mensaje={mensajeDeError(error)} onReintentar={refetch} />
        )}

        {!isPending && !isError && !hayDatos && (
          <EstadoVacioCatalogo onReintentar={refetch} />
        )}

        {!isPending && !isError && hayDatos && pacientes.length === 0 && (
          <EstadoSinResultados
            termino={busqueda}
            onLimpiar={() => cambiarBusqueda("")}
          />
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-primary text-xs font-semibold tracking-wider uppercase">
          Expedientes
        </p>
        <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Pacientes
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Catalogo de pacientes activos de la clinica.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="tabular-nums">
          {total} {total === 1 ? "registro" : "registros"}
        </Badge>
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
    <div className="bg-card overflow-hidden rounded-xl border border-border shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 text-sm">
          <caption className="sr-only">
            Pacientes activos de la clinica
          </caption>
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th scope="col" className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase md:px-6">
                Paciente
              </th>
              <th scope="col" className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase lg:table-cell">
                Contacto
              </th>
              <th scope="col" className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase md:table-cell">
                Nacimiento
              </th>
              <th scope="col" className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase sm:table-cell">
                Edad
              </th>
              <th scope="col" className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase md:px-6">
                Sexo
              </th>
              {/* Columna de acciones: sin etiqueta visible, pero se conserva
                  el <th> para que el numero de columnas siga cuadrando con
                  los <td> de cada fila. */}
              <th scope="col" className="w-12 py-3 pr-3 pl-0 md:pr-4">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pacientes.map((paciente) => (
              <FilaPaciente key={paciente.id} paciente={paciente} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilaPaciente({ paciente }: { paciente: Paciente }) {
  return (
    <tr className="hover:bg-accent transition-colors">
      <td className="px-4 py-3 md:px-6">
        <Link
          to={`/pacientes/${paciente.id}`}
          className="-mx-2 flex items-center gap-3 rounded-md px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AvatarPaciente nombre={paciente.nombreCompleto} id={paciente.id} />
          <div className="min-w-0">
            <p className="text-foreground truncate font-medium">
              {paciente.nombreCompleto}
            </p>
            {/* En movil las columnas ocultas se sustituyen por estas lineas. */}
            <p className="text-muted-foreground truncate text-xs lg:hidden">
              {paciente.correoElectronico}
            </p>
            <p className="text-muted-foreground truncate text-xs lg:hidden">
              {formatearFechaCorta(paciente.fechaNacimiento)}
              {paciente.edad !== null && ` · ${paciente.edad} anos`}
            </p>
          </div>
        </Link>
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <p className="truncate">{paciente.correoElectronico}</p>
        <p className="text-muted-foreground truncate text-xs">
          {paciente.telefono}
        </p>
      </td>
      <td className="text-muted-foreground hidden px-4 py-3 md:table-cell">
        {formatearFechaCorta(paciente.fechaNacimiento)}
      </td>
      <td className="text-muted-foreground hidden px-4 py-3 sm:table-cell tabular-nums">
        {paciente.edad !== null ? `${paciente.edad}` : "—"}
      </td>
      <td className="px-4 py-3 md:px-6">
        <Badge variant="outline">{etiquetaSexo(paciente.sexo)}</Badge>
      </td>
      {/* El menu de acciones es la unica accion disponible, asi que esta
          columna NO se oculta en movil: es la que sobrevive al colapso. */}
      <td className="w-12 py-3 pr-3 pl-0 text-right md:pr-4">
        <AccionesPaciente paciente={paciente} />
      </td>
    </tr>
  );
}

function TablaSkeleton() {
  return (
    <div
      className="bg-card overflow-hidden rounded-xl border border-border shadow-card"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Cargando pacientes...</span>
      <div className="bg-muted/40 border-b border-border px-6 py-3">
        <div className="skeleton h-4 w-24 rounded" />
      </div>
      <ul className="divide-y divide-border">
        {Array.from({ length: 6 }, (_, indice) => (
          <li key={indice} className="flex items-center gap-3 px-4 py-3 md:px-6">
            <div className="skeleton size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-2/5 max-w-56 rounded" />
              <div className="skeleton h-3 w-1/4 max-w-40 rounded" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EstadoError({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <Card className="border-destructive/40">
      <CardContent className="flex flex-col items-start gap-4 px-6 py-10 sm:flex-row sm:items-center">
        <div className="bg-destructive/10 text-destructive grid size-11 shrink-0 place-items-center rounded-full">
          <X className="size-5" aria-hidden />
        </div>
        <div className="flex-1">
          <h2 className="text-foreground font-semibold">No pudimos cargar los pacientes</h2>
          <p className="text-muted-foreground mt-1 text-sm">{mensaje}</p>
        </div>
        <Button variant="outline" onClick={onReintentar} className="shrink-0">
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );
}

function EstadoVacioCatalogo({ onReintentar }: { onReintentar: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <AvatarPaciente nombre="Paciente" id="vacio" className="size-14" />
        <div>
          <h2 className="text-foreground font-semibold">Todavia no hay pacientes</h2>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
            La clinica todavia no tiene pacientes activos registrados. Cuando se
            de de alta el primero, aparecera aqui.
          </p>
        </div>
        <Button variant="outline" onClick={onReintentar} className="mt-1">
          Actualizar
        </Button>
      </CardContent>
    </Card>
  );
}

function EstadoSinResultados({ termino, onLimpiar }: { termino: string; onLimpiar: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <div className="bg-muted text-muted-foreground grid size-14 place-items-center rounded-full">
          <Search className="size-6" aria-hidden />
        </div>
        <div>
          <h2 className="text-foreground font-semibold">Sin coincidencias</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Ningun paciente coincide con{" "}
            <span className="text-foreground font-medium">"{termino}"</span>.
          </p>
        </div>
        <Button variant="outline" onClick={onLimpiar} className="mt-1">
          Limpiar busqueda
        </Button>
      </CardContent>
    </Card>
  );
}
