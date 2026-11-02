import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Search } from "lucide-react";

import { EstadoError } from "@/components/states/estado-error";
import { EstadoVacio } from "@/components/states/estado-vacio";
import { SkeletonTabla } from "@/components/states/skeleton-tabla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cobrosApi } from "@/features/cobros/api/cobros-api";
import { useFacturas } from "@/features/cobros/hooks/use-cobros";
import { formatearMoneda } from "@/features/cobros/lib/cobros";
import { mensajeDeError } from "@/lib/api-error";
import { formatearFechaCorta, normalizar } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/** Facturas emitidas, de la mas reciente a la mas antigua, con su PDF. */
export function TabFacturas() {
  const facturas = useFacturas({});
  const [busqueda, setBusqueda] = useState("");

  const termino = normalizar(busqueda);
  const lista = useMemo(
    () =>
      [...(facturas.data ?? [])]
        .filter(
          (f) =>
            !termino ||
            normalizar(f.nombreRazonSocial).includes(termino) ||
            f.rfc.toLowerCase().includes(termino) ||
            `${f.serie}-${f.folio}`.toLowerCase().includes(termino),
        )
        .sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision)),
    [facturas.data, termino],
  );

  const abrirPdf = (facturaId: string) =>
    cobrosApi
      .abrirFacturaPdf(facturaId)
      .catch((error) => toast.error("No se pudo abrir el PDF", { description: mensajeDeError(error) }));

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, RFC o folio..."
          aria-label="Buscar factura"
          className="bg-card shadow-subtle h-10 pl-9"
        />
      </div>

      {facturas.isPending && <SkeletonTabla anchos={["w-20", "w-56", "w-24", "w-24", "w-16"]} filas={5} />}
      {facturas.isError && (
        <EstadoError
          titulo="No pudimos cargar las facturas"
          mensaje={mensajeDeError(facturas.error)}
          onReintentar={facturas.refetch}
        />
      )}
      {facturas.isSuccess && lista.length === 0 && (
        <EstadoVacio
          icono={busqueda ? Search : FileText}
          titulo={busqueda ? "Sin coincidencias" : "Todavía no hay facturas"}
          descripcion={
            busqueda
              ? `Ninguna factura coincide con "${busqueda}".`
              : "Las facturas se emiten desde un cobro: al cobrar la consulta o desde la pestaña Cobros."
          }
        />
      )}

      {lista.length > 0 && (
        <div className="hoja overflow-hidden rounded-xl">
          <Table>
            <caption className="sr-only">Facturas emitidas</caption>
            <TableHeader>
              <TableRow className="bg-surface-subtle/70 hover:bg-surface-subtle/70">
                <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium md:px-6">Folio</TableHead>
                <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium">Receptor</TableHead>
                <TableHead className="text-muted-foreground hidden px-4 py-3 text-xs font-medium sm:table-cell">Emitida</TableHead>
                <TableHead className="text-muted-foreground px-4 py-3 text-right text-xs font-medium">Total</TableHead>
                <TableHead className="w-24 py-3 pr-4 pl-0">
                  <span className="sr-only">PDF</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((f) => (
                <TableRow key={f.id} className={cn("hover:bg-accent", f.estatus === "Anulada" && "opacity-60")}>
                  <TableCell className="px-4 py-3 font-medium tabular-nums md:px-6">
                    {f.serie}-{String(f.folio).padStart(4, "0")}
                    {f.estatus !== "Emitida" && <p className="text-muted-foreground text-xs">{f.estatus}</p>}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-normal">
                    <p className="text-foreground font-medium">{f.nombreRazonSocial}</p>
                    <p className="text-muted-foreground font-mono text-xs">{f.rfc}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden px-4 py-3 text-sm sm:table-cell">
                    {formatearFechaCorta(f.fechaEmision)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <p className="font-semibold tabular-nums">{formatearMoneda(f.total)}</p>
                    <p className="text-muted-foreground text-xs tabular-nums">IVA {formatearMoneda(f.iva)}</p>
                  </TableCell>
                  <TableCell className="w-24 py-3 pr-4 pl-0 text-right">
                    <Button variant="outline" size="sm" onClick={() => abrirPdf(f.id)}>
                      <FileText className="size-4" />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
