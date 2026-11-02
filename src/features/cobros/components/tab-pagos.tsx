import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, FileText, MoreHorizontal, Receipt, ReceiptText } from "lucide-react";

import { EstadoError } from "@/components/states/estado-error";
import { EstadoVacio } from "@/components/states/estado-vacio";
import { SkeletonTabla } from "@/components/states/skeleton-tabla";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SelectorFecha } from "@/components/ui/selector-fecha";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cobrosApi } from "@/features/cobros/api/cobros-api";
import { FormularioFactura } from "@/features/cobros/components/formulario-factura";
import { useAnularPago, useFacturas, usePagos } from "@/features/cobros/hooks/use-cobros";
import { ETIQUETA_METODO, formatearMoneda, METODOS_PAGO } from "@/features/cobros/lib/cobros";
import { formatearHoraLocal } from "@/features/citas/lib/fechas-cita";
import { mensajeDeError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { Factura, Pago } from "@/types/api";
import { hoyCalendario, rangoDelDia } from "@/lib/zona-horaria";

/** Dia completo de la clinica, con los nombres de filtro de la API de pagos. */
function rangoDePagos(dia: Date) {
  const { desde, hasta } = rangoDelDia(dia);
  return { fechaInicio: desde, fechaFin: hasta };
}

const folio = (f: Factura) => `${f.serie}-${String(f.folio).padStart(4, "0")}`;

function abrirPdf(accion: () => Promise<void>) {
  accion().catch((error) => toast.error("No se pudo abrir el PDF", { description: mensajeDeError(error) }));
}

/**
 * Cobros de un dia con el corte arriba: total cobrado y desglose por metodo,
 * que es lo que se cuadra contra la caja y la terminal al cerrar el dia.
 */
export function TabPagos() {
  const [dia, setDia] = useState<Date>(() => hoyCalendario());
  const rango = useMemo(() => rangoDePagos(dia), [dia]);

  const pagos = usePagos(rango);
  /* Facturas sin filtro de fecha: un pago de hoy puede facturarse otro dia. */
  const facturas = useFacturas({});
  const [facturando, setFacturando] = useState<Pago | null>(null);
  const [anulando, setAnulando] = useState<Pago | null>(null);

  const facturaPorPago = useMemo(
    () => new Map((facturas.data ?? []).filter((f) => f.estatus !== "Anulada").map((f) => [f.pagoId, f])),
    [facturas.data],
  );

  const lista = useMemo(
    () => [...(pagos.data ?? [])].sort((a, b) => b.fechaPago.localeCompare(a.fechaPago)),
    [pagos.data],
  );
  const vigentes = lista.filter((p) => p.estado === "Pagado");
  const total = vigentes.reduce((s, p) => s + p.monto, 0);
  const porMetodo = METODOS_PAGO.map((m) => ({
    ...m,
    total: vigentes.filter((p) => p.metodoPago === m.valor).reduce((s, p) => s + p.monto, 0),
  })).filter((m) => m.total > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-56">
          <SelectorFecha
            value={dia}
            onChange={(fecha) => fecha && setDia(fecha)}
            formato="corto"
            hasta={hoyCalendario()}
          />
        </div>
      </div>

      {/* ---------- Corte del dia ---------- */}
      <div className="hoja grid gap-4 rounded-xl px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)] md:px-6">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Corte del día</p>
          <p className="text-foreground mt-1 text-3xl font-bold tracking-tight tabular-nums">{formatearMoneda(total)}</p>
          <p className="text-muted-foreground text-xs">
            {vigentes.length === 1 ? "1 cobro" : `${vigentes.length} cobros`}
            {lista.length > vigentes.length && ` · ${lista.length - vigentes.length} anulado(s)`}
          </p>
        </div>
        <div className="flex flex-wrap content-center gap-2 sm:justify-end">
          {porMetodo.length === 0 ? (
            <span className="text-muted-foreground text-sm">Sin cobros este día.</span>
          ) : (
            porMetodo.map((m) => (
              <span key={m.valor} className="bg-surface-subtle rounded-lg border px-3 py-1.5 text-sm">
                <span className="text-muted-foreground">{m.etiqueta}</span>{" "}
                <span className="text-foreground font-semibold tabular-nums">{formatearMoneda(m.total)}</span>
              </span>
            ))
          )}
        </div>
      </div>

      {pagos.isPending && <SkeletonTabla anchos={["w-16", "w-24", "w-48", "w-24", "w-20", "w-12"]} filas={4} />}
      {pagos.isError && (
        <EstadoError titulo="No pudimos cargar los cobros" mensaje={mensajeDeError(pagos.error)} onReintentar={pagos.refetch} />
      )}
      {pagos.isSuccess && lista.length === 0 && (
        <EstadoVacio icono={Receipt} titulo="Sin cobros" descripcion="No se registraron cobros este día." />
      )}

      {lista.length > 0 && (
        <div className="hoja overflow-hidden rounded-xl">
          <Table>
            <caption className="sr-only">Cobros del día</caption>
            <TableHeader>
              <TableRow className="bg-surface-subtle/70 hover:bg-surface-subtle/70">
                <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium md:px-6">Hora</TableHead>
                <TableHead className="text-muted-foreground px-4 py-3 text-xs font-medium">Paciente</TableHead>
                <TableHead className="text-muted-foreground hidden px-4 py-3 text-xs font-medium sm:table-cell">Método</TableHead>
                <TableHead className="text-muted-foreground px-4 py-3 text-right text-xs font-medium">Monto</TableHead>
                <TableHead className="text-muted-foreground hidden px-4 py-3 text-xs font-medium md:table-cell">Factura</TableHead>
                <TableHead className="w-12 py-3 pr-3 pl-0">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((pago) => {
                const factura = facturaPorPago.get(pago.id);
                const anulado = pago.estado === "Anulado";
                return (
                  <TableRow key={pago.id} className={cn("hover:bg-accent", anulado && "opacity-60")}>
                    <TableCell className="px-4 py-3 tabular-nums md:px-6">
                      <p className="text-foreground text-sm">{formatearHoraLocal(pago.fechaPago)}</p>
                      <p className="text-muted-foreground text-xs">{pago.numeroRecibo}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
                      <p className="text-foreground font-medium">{pago.pacienteNombre}</p>
                      {pago.notas && <p className="text-muted-foreground line-clamp-1 text-xs">{pago.notas}</p>}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden px-4 py-3 text-sm sm:table-cell">
                      {ETIQUETA_METODO[pago.metodoPago]}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <span className={cn("font-semibold tabular-nums", anulado && "line-through")}>
                        {formatearMoneda(pago.monto)}
                      </span>
                      {anulado && <p className="text-destructive text-xs">Anulado</p>}
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-sm md:table-cell">
                      {factura ? (
                        <span className="bg-success-soft text-success-soft-foreground rounded px-1.5 py-0.5 text-xs font-medium">
                          {folio(factura)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground-subtle text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="w-12 py-3 pr-3 pl-0 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={`Acciones del cobro ${pago.numeroRecibo}`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onSelect={() => abrirPdf(() => cobrosApi.abrirComprobante(pago.id))}>
                            <ReceiptText />
                            Ver recibo
                          </DropdownMenuItem>
                          {factura ? (
                            <DropdownMenuItem onSelect={() => abrirPdf(() => cobrosApi.abrirFacturaPdf(factura.id))}>
                              <FileText />
                              Ver factura {folio(factura)}
                            </DropdownMenuItem>
                          ) : (
                            !anulado && (
                              <DropdownMenuItem onSelect={() => setFacturando(pago)}>
                                <FileText />
                                Facturar
                              </DropdownMenuItem>
                            )
                          )}
                          {!anulado && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={Boolean(factura)}
                                onSelect={() => setAnulando(pago)}
                              >
                                <Ban />
                                {factura ? "Facturado: no se anula" : "Anular cobro"}
                              </DropdownMenuItem>
                            </>
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

      <Dialog open={facturando !== null} onOpenChange={(a) => !a && setFacturando(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader icono={FileText}>
            <DialogTitle>Facturar cobro</DialogTitle>
            <DialogDescription>
              {facturando?.pacienteNombre} · {facturando && formatearMoneda(facturando.monto)}
            </DialogDescription>
          </DialogHeader>
          {facturando && (
            <FormularioFactura
              pago={facturando}
              onCancelar={() => setFacturando(null)}
              onEmitida={(f) => {
                toast.success(`Factura ${folio(f)} emitida`, { description: f.nombreRazonSocial });
                setFacturando(null);
                abrirPdf(() => cobrosApi.abrirFacturaPdf(f.id));
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <DialogoAnular pago={anulando} onOpenChange={(a) => !a && setAnulando(null)} />
    </div>
  );
}

function DialogoAnular({ pago, onOpenChange }: { pago: Pago | null; onOpenChange: (abierto: boolean) => void }) {
  const anular = useAnularPago();
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cambiar = (abierto: boolean) => {
    if (!abierto) {
      setMotivo("");
      setError(null);
    }
    onOpenChange(abierto);
  };

  return (
    <AlertDialog open={pago !== null} onOpenChange={cambiar}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Anular el cobro {pago?.numeroRecibo}?</AlertDialogTitle>
          <AlertDialogDescription>
            La consulta vuelve a quedar por cobrar y podrás cobrarla de nuevo con el monto correcto. El recibo
            anulado se conserva.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (opcional): monto equivocado, método incorrecto…"
          rows={2}
          maxLength={300}
          className="bg-card resize-none"
        />
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={anular.isPending}>Volver</AlertDialogCancel>
          <AlertDialogAction
            disabled={anular.isPending}
            className="bg-destructive border-destructive/80 hover:bg-destructive/90 text-white"
            onClick={(e) => {
              e.preventDefault();
              if (!pago) return;
              setError(null);
              anular.mutate(
                { pagoId: pago.id, motivo: motivo.trim() || null },
                {
                  onSuccess: () => {
                    toast.success("Cobro anulado", { description: pago.numeroRecibo });
                    cambiar(false);
                  },
                  onError: (fallo) => setError(mensajeDeError(fallo)),
                },
              );
            }}
          >
            {anular.isPending ? "Anulando..." : "Anular cobro"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
