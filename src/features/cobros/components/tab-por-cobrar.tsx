import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Wallet } from "lucide-react";

import { EstadoError } from "@/components/states/estado-error";
import { EstadoVacio } from "@/components/states/estado-vacio";
import { SkeletonTabla } from "@/components/states/skeleton-tabla";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DialogoCobro } from "@/features/cobros/components/dialogo-cobro";
import { DIAS_POR_COBRAR, usePorCobrar } from "@/features/cobros/hooks/use-cobros";
import { formatearFechaLargaLocal, formatearHoraLocal } from "@/features/citas/lib/fechas-cita";
import { BadgeTipoConsulta } from "@/features/consultas/components/badge-tipo-consulta";
import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import { mensajeDeError } from "@/lib/api-error";
import { formatearTiempoRelativo } from "@/lib/formatters";
import type { Consulta } from "@/types/api";

/**
 * Consultas cerradas sin pago vigente. Es la red de seguridad del "Cobrar
 * despues": nada que se atendio se queda sin cobrar por olvido.
 */
export function TabPorCobrar() {
  const { pendientes, cargando, error, reintentar } = usePorCobrar();
  const [cobrando, setCobrando] = useState<Consulta | null>(null);

  if (cargando) return <SkeletonTabla anchos={["w-56", "w-28", "w-32", "w-24"]} filas={4} conAvatar />;

  if (error) {
    return (
      <EstadoError
        titulo="No pudimos cargar lo pendiente de cobro"
        mensaje={mensajeDeError(error)}
        onReintentar={reintentar}
      />
    );
  }

  if (pendientes.length === 0) {
    return (
      <EstadoVacio
        icono={CheckCircle2}
        titulo="Todo cobrado"
        descripcion={`No hay consultas cerradas sin pago en los últimos ${DIAS_POR_COBRAR} días.`}
      />
    );
  }

  return (
    <>
      <p className="text-muted-foreground mb-3 text-sm">
        {pendientes.length === 1 ? "1 consulta cerrada" : `${pendientes.length} consultas cerradas`} sin cobrar en los
        últimos {DIAS_POR_COBRAR} días.
      </p>
      <div className="hoja overflow-hidden rounded-xl">
        <Table>
          <caption className="sr-only">Consultas por cobrar</caption>
          <TableHeader>
            <TableRow className="bg-surface-subtle/70 hover:bg-surface-subtle/70">
              <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium md:px-6">Paciente</TableHead>
              <TableHead className="text-muted-foreground hidden px-4 py-3 text-xs font-medium sm:table-cell">Consulta</TableHead>
              <TableHead className="text-muted-foreground hidden px-4 py-3 text-xs font-medium md:table-cell">Atendida</TableHead>
              <TableHead className="w-32 py-3 pr-4 pl-0">
                <span className="sr-only">Cobrar</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendientes.map((consulta) => (
              <TableRow key={consulta.id} className="hover:bg-accent">
                <TableCell className="px-4 py-3 whitespace-normal md:px-6">
                  <div className="flex items-center gap-3">
                    <AvatarPaciente nombre={consulta.pacienteNombre} id={consulta.pacienteId} />
                    <div className="min-w-0">
                      <Link
                        to={`/consultas/${consulta.id}`}
                        className="text-foreground truncate font-medium hover:underline"
                      >
                        {consulta.pacienteNombre}
                      </Link>
                      <p className="text-muted-foreground text-xs">{formatearTiempoRelativo(consulta.fechaFin)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden px-4 py-3 sm:table-cell">
                  <BadgeTipoConsulta tipo={consulta.tipoConsulta} />
                </TableCell>
                <TableCell className="text-muted-foreground hidden px-4 py-3 text-sm md:table-cell">
                  {formatearFechaLargaLocal(consulta.fechaInicio)} · {formatearHoraLocal(consulta.fechaInicio)}
                </TableCell>
                <TableCell className="w-32 py-3 pr-4 pl-0 text-right">
                  <Button size="sm" onClick={() => setCobrando(consulta)}>
                    <Wallet className="size-4" />
                    Cobrar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DialogoCobro consulta={cobrando} onOpenChange={(a) => !a && setCobrando(null)} />
    </>
  );
}
