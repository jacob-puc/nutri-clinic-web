import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileText, Loader2, Receipt, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertaFormulario } from "@/components/ui/grupo-campos";
import { InputUnidad } from "@/components/ui/input-unidad";
import { Label } from "@/components/ui/label";
import { Segmentado } from "@/components/ui/segmentado";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cobrosApi } from "@/features/cobros/api/cobros-api";
import { FormularioFactura } from "@/features/cobros/components/formulario-factura";
import { useCrearPago, usePagoDeConsulta, usePagos } from "@/features/cobros/hooks/use-cobros";
import { ETIQUETA_METODO, formatearMoneda, METODOS_PAGO, MONTO_MAXIMO } from "@/features/cobros/lib/cobros";
import { useConsultas } from "@/features/consultas/hooks/use-consultas";
import { ETIQUETA_TIPO_CONSULTA } from "@/features/consultas/lib/etiquetas-consulta";
import { mensajeDeError } from "@/lib/api-error";
import type { Consulta, Factura, MetodoPago, Pago, TipoConsulta } from "@/types/api";

/**
 * Cobro de una consulta cerrada en un solo dialogo: cobrar, ver el recibo y,
 * si el paciente la pide, facturar ahi mismo. "Cobrar despues" no bloquea:
 * la consulta queda en Cobros → Por cobrar.
 */
export function DialogoCobro({
  consulta,
  onOpenChange,
  onTerminar,
}: {
  /** Con consulta el dialogo esta abierto. Debe estar cerrada. */
  consulta: Consulta | null;
  onOpenChange: (abierto: boolean) => void;
  /** Se llama al terminar o al dejar el cobro para despues. */
  onTerminar?: () => void;
}) {
  const cerrar = () => {
    onOpenChange(false);
    onTerminar?.();
  };

  return (
    <Dialog open={consulta !== null} onOpenChange={(abierto) => (abierto ? onOpenChange(true) : cerrar())}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {consulta && <Contenido key={consulta.id} consulta={consulta} onCerrar={cerrar} />}
      </DialogContent>
    </Dialog>
  );
}

type Paso = "cobrar" | "cobrado" | "facturar" | "facturado";

function Contenido({ consulta, onCerrar }: { consulta: Consulta; onCerrar: () => void }) {
  const existente = usePagoDeConsulta(consulta.id);
  const [pago, setPago] = useState<Pago | null>(null);
  const [factura, setFactura] = useState<Factura | null>(null);
  const [paso, setPaso] = useState<Paso>("cobrar");

  const vigente = pago ?? existente.pago;
  /* Si la consulta ya estaba cobrada se salta directo al recibo. */
  const pasoVisible: Paso = vigente && paso === "cobrar" ? "cobrado" : paso;

  if (existente.isPending && !pago) {
    return (
      <div className="space-y-3 py-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <>
      <DialogHeader icono={pasoVisible === "cobrar" ? Wallet : pasoVisible === "facturar" ? FileText : CheckCircle2}>
        <DialogTitle>
          {pasoVisible === "cobrar" && "Cobrar consulta"}
          {pasoVisible === "cobrado" && "Consulta cobrada"}
          {pasoVisible === "facturar" && "Facturar"}
          {pasoVisible === "facturado" && "Factura emitida"}
        </DialogTitle>
        <DialogDescription>
          {consulta.pacienteNombre} · {ETIQUETA_TIPO_CONSULTA[consulta.tipoConsulta]}
        </DialogDescription>
      </DialogHeader>

      {pasoVisible === "cobrar" && (
        <PasoCobrar
          consulta={consulta}
          onCobrado={(nuevo) => {
            setPago(nuevo);
            setPaso("cobrado");
          }}
          onDespues={onCerrar}
        />
      )}

      {pasoVisible === "cobrado" && vigente && (
        <PasoCobrado pago={vigente} onFacturar={() => setPaso("facturar")} onTerminar={onCerrar} />
      )}

      {pasoVisible === "facturar" && vigente && (
        <FormularioFactura
          pago={vigente}
          textoCancelar="Volver"
          onCancelar={() => setPaso("cobrado")}
          onEmitida={(emitida) => {
            setFactura(emitida);
            setPaso("facturado");
            toast.success(`Factura ${emitida.serie}-${String(emitida.folio).padStart(4, "0")} emitida`);
          }}
        />
      )}

      {pasoVisible === "facturado" && factura && (
        <>
          <Confirmacion
            titulo={`Factura ${factura.serie}-${String(factura.folio).padStart(4, "0")}`}
            detalle={`${factura.nombreRazonSocial} · ${factura.rfc} · ${formatearMoneda(factura.total)}`}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => abrir(() => cobrosApi.abrirFacturaPdf(factura.id))}>
              <FileText className="size-4" />
              Ver factura
            </Button>
            <Button onClick={onCerrar}>Terminar</Button>
          </DialogFooter>
        </>
      )}
    </>
  );
}

/* ---------- Paso 1: cobrar ---------- */

/**
 * Monto sugerido: lo ultimo que se cobro por una consulta del mismo tipo.
 * No hay tabla de precios en el backend; en la practica el precio de una
 * consulta de seguimiento es el de la anterior.
 */
function useMontoSugerido(tipo: TipoConsulta): number | undefined {
  const pagos = usePagos({ estado: "Pagado" });
  const consultas = useConsultas({});
  return useMemo(() => {
    const tipoPorConsulta = new Map((consultas.data ?? []).map((c) => [c.id, c.tipoConsulta]));
    const ultimo = [...(pagos.data ?? [])]
      .sort((a, b) => b.fechaPago.localeCompare(a.fechaPago))
      .find((p) => tipoPorConsulta.get(p.consultaId) === tipo);
    return ultimo?.monto;
  }, [pagos.data, consultas.data, tipo]);
}

function PasoCobrar({
  consulta,
  onCobrado,
  onDespues,
}: {
  consulta: Consulta;
  onCobrado: (pago: Pago) => void;
  onDespues: () => void;
}) {
  const crear = useCrearPago();
  const sugerido = useMontoSugerido(consulta.tipoConsulta);
  const [monto, setMonto] = useState<number | undefined>(undefined);
  const [metodo, setMetodo] = useState<MetodoPago>("Efectivo");
  const [notas, setNotas] = useState("");
  const [intento, setIntento] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* El sugerido llega despues de montar: se usa mientras no se escriba otro. */
  const montoVigente = monto ?? sugerido;
  const errorMonto =
    montoVigente === undefined || Number.isNaN(montoVigente) || montoVigente <= 0
      ? "Indica el monto."
      : montoVigente > MONTO_MAXIMO
        ? `No puede superar ${formatearMoneda(MONTO_MAXIMO)}.`
        : null;

  const cobrar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setIntento(true);
    setError(null);
    if (errorMonto) return;
    try {
      const pago = await crear.mutateAsync({
        consultaId: consulta.id,
        monto: montoVigente!,
        metodoPago: metodo,
        notas: notas.trim() || null,
      });
      toast.success(`Cobrado · ${pago.numeroRecibo}`, { description: formatearMoneda(pago.monto) });
      onCobrado(pago);
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  };

  return (
    <form onSubmit={cobrar} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="cobro-monto">Monto</Label>
        <InputUnidad
          id="cobro-monto"
          unidad="MXN"
          inputMode="decimal"
          step="50"
          autoFocus
          value={montoVigente ?? ""}
          onChange={(e) => setMonto(e.target.value === "" ? Number.NaN : Number(e.target.value))}
          placeholder="0.00"
          className="h-12 text-lg font-semibold"
          aria-invalid={intento && errorMonto ? true : undefined}
        />
        {intento && errorMonto ? (
          <p className="text-destructive text-xs">{errorMonto}</p>
        ) : sugerido !== undefined ? (
          <p className="text-muted-foreground text-xs">
            Lo último cobrado por una consulta de {ETIQUETA_TIPO_CONSULTA[consulta.tipoConsulta].toLowerCase()}.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Método de pago</Label>
        <Segmentado
          variante="chips"
          aria-label="Método de pago"
          value={metodo}
          onChange={setMetodo}
          opciones={METODOS_PAGO.map((m) => ({ valor: m.valor, etiqueta: m.etiqueta }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cobro-notas">
          Notas <span className="text-muted-foreground-subtle text-xs font-normal">(opcional)</span>
        </Label>
        <Textarea
          id="cobro-notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Referencia de la transferencia, descuento aplicado…"
          className="bg-card resize-none"
        />
      </div>

      {error && <AlertaFormulario>{error}</AlertaFormulario>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDespues} disabled={crear.isPending}>
          Cobrar después
        </Button>
        <Button type="submit" disabled={crear.isPending}>
          {crear.isPending ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
          {montoVigente && !errorMonto ? `Cobrar ${formatearMoneda(montoVigente)}` : "Cobrar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/* ---------- Paso 2: cobrado ---------- */

function PasoCobrado({
  pago,
  onFacturar,
  onTerminar,
}: {
  pago: Pago;
  onFacturar: () => void;
  onTerminar: () => void;
}) {
  return (
    <>
      <Confirmacion
        titulo={`${formatearMoneda(pago.monto)} · ${ETIQUETA_METODO[pago.metodoPago]}`}
        detalle={`Recibo ${pago.numeroRecibo}`}
      />
      <DialogFooter>
        <Button variant="outline" onClick={() => abrir(() => cobrosApi.abrirComprobante(pago.id))}>
          <Receipt className="size-4" />
          Ver recibo
        </Button>
        <Button variant="outline" onClick={onFacturar}>
          <FileText className="size-4" />
          Facturar
        </Button>
        <Button onClick={onTerminar}>Terminar</Button>
      </DialogFooter>
    </>
  );
}

function Confirmacion({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="bg-success-soft text-success-soft-foreground flex items-center gap-3 rounded-xl px-4 py-4">
      <CheckCircle2 className="size-8 shrink-0" aria-hidden />
      <div>
        <p className="text-lg font-semibold tabular-nums">{titulo}</p>
        <p className="text-sm opacity-90">{detalle}</p>
      </div>
    </div>
  );
}

/** Abre un PDF y avisa si falla (p. ej. el backend no pudo generarlo). */
function abrir(accion: () => Promise<void>) {
  accion().catch((error) => toast.error("No se pudo abrir el PDF", { description: mensajeDeError(error) }));
}
