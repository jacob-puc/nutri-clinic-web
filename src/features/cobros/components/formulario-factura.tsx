import { useState } from "react";
import { Link } from "react-router-dom";
import { FileCheck2, History, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AlertaFormulario } from "@/components/ui/grupo-campos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmentado } from "@/components/ui/segmentado";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDatosClinica, useEmitirFactura, useUltimosDatosFiscales } from "@/features/cobros/hooks/use-cobros";
import {
  formatearMoneda,
  regimenesPara,
  USO_CFDI_SUGERIDO,
  USOS_CFDI,
  validarRfc,
} from "@/features/cobros/lib/cobros";
import { mensajeDeError } from "@/lib/api-error";
import { formatearFechaCorta } from "@/lib/formatters";
import type { DatosFiscalesReceptor, Factura, Pago, TipoPersona } from "@/types/api";

/**
 * Datos fiscales del paciente para facturar un pago. Llega lleno con los de
 * su ultima factura (el enlace con el paciente es su historial de facturas);
 * todo es editable, y lo que se emita aqui sera lo que se precargue la
 * proxima vez.
 */
export function FormularioFactura({
  pago,
  onEmitida,
  onCancelar,
  textoCancelar = "Cancelar",
}: {
  pago: Pago;
  onEmitida: (factura: Factura) => void;
  onCancelar: () => void;
  textoCancelar?: string;
}) {
  const ultimos = useUltimosDatosFiscales(pago.pacienteId);
  const clinica = useDatosClinica();

  if (ultimos.cargando || clinica.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-2/3" />
      </div>
    );
  }

  if (clinica.data === null) {
    return (
      <AlertaFormulario>
        La clínica todavía no tiene datos fiscales. Configúralos en{" "}
        <Link to="/cobros?vista=clinica" className="font-semibold underline">
          Cobros → Datos fiscales
        </Link>{" "}
        para poder facturar.
      </AlertaFormulario>
    );
  }

  return (
    <Campos
      pago={pago}
      inicial={ultimos.datos}
      tarifaIva={clinica.data?.tarifaIva ?? 16}
      onEmitida={onEmitida}
      onCancelar={onCancelar}
      textoCancelar={textoCancelar}
    />
  );
}

function Campos({
  pago,
  inicial,
  tarifaIva,
  onEmitida,
  onCancelar,
  textoCancelar,
}: {
  pago: Pago;
  inicial: DatosFiscalesReceptor | null;
  tarifaIva: number;
  onEmitida: (factura: Factura) => void;
  onCancelar: () => void;
  textoCancelar: string;
}) {
  const emitir = useEmitirFactura();
  const [datos, setDatos] = useState<DatosFiscalesReceptor>(
    () =>
      inicial ?? {
        tipoPersona: "Fisica",
        rfc: "",
        razonSocial: pago.pacienteNombre.toUpperCase(),
        regimenFiscal: "SueldosYSalarios",
        usoCfdi: USO_CFDI_SUGERIDO.Fisica,
        codigoPostal: "",
      },
  );
  const [intento, setIntento] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiar = (cambios: Partial<DatosFiscalesReceptor>) => setDatos((d) => ({ ...d, ...cambios }));

  /* Al cambiar el tipo de persona, el regimen y el uso se ajustan a uno
     valido para ese tipo (el backend rechaza combinaciones incompatibles). */
  const cambiarTipo = (tipo: TipoPersona) => {
    const regimenes = regimenesPara(tipo);
    cambiar({
      tipoPersona: tipo,
      regimenFiscal: regimenes.some((r) => r.valor === datos.regimenFiscal)
        ? datos.regimenFiscal
        : regimenes[0]!.valor,
      usoCfdi: USO_CFDI_SUGERIDO[tipo],
    });
  };

  const errores = {
    rfc: validarRfc(datos.rfc, datos.tipoPersona),
    razonSocial: datos.razonSocial.trim() === "" ? "El nombre o razón social es obligatorio." : null,
    codigoPostal: /^[0-9]{5}$/.test(datos.codigoPostal.trim()) ? null : "El código postal lleva 5 dígitos.",
  };
  const ver = (campo: keyof typeof errores) => (intento ? errores[campo] : null);

  const subtotal = Math.round((pago.monto / (1 + tarifaIva / 100)) * 100) / 100;

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setIntento(true);
    setError(null);
    if (Object.values(errores).some(Boolean)) return;
    try {
      const factura = await emitir.mutateAsync({
        pagoId: pago.id,
        receptor: {
          ...datos,
          rfc: datos.rfc.trim().toUpperCase(),
          razonSocial: datos.razonSocial.trim(),
          codigoPostal: datos.codigoPostal.trim(),
        },
      });
      onEmitida(factura);
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      {inicial && (
        <p className="bg-primary-soft text-primary-soft-foreground flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs">
          <History className="size-3.5 shrink-0" aria-hidden />
          Datos de su última factura. Corrígelos si cambiaron.
        </p>
      )}

      <div className="space-y-2">
        <Label>Tipo de persona</Label>
        <Segmentado
          aria-label="Tipo de persona"
          value={datos.tipoPersona}
          onChange={cambiarTipo}
          opciones={[
            { valor: "Fisica", etiqueta: "Física" },
            { valor: "Moral", etiqueta: "Moral (empresa)" },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <div className="space-y-1.5">
          <Label htmlFor="factura-rfc">RFC</Label>
          <Input
            id="factura-rfc"
            value={datos.rfc}
            onChange={(e) => cambiar({ rfc: e.target.value.toUpperCase() })}
            maxLength={13}
            placeholder={datos.tipoPersona === "Moral" ? "ABC010101AB1" : "LOPA850101AB1"}
            className="bg-card h-10 font-mono uppercase"
            aria-invalid={ver("rfc") ? true : undefined}
          />
          {ver("rfc") && <p className="text-destructive text-xs">{ver("rfc")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="factura-cp">C.P. fiscal</Label>
          <Input
            id="factura-cp"
            inputMode="numeric"
            value={datos.codigoPostal}
            onChange={(e) => cambiar({ codigoPostal: e.target.value.replace(/\D/g, "").slice(0, 5) })}
            placeholder="64000"
            className="bg-card h-10 tabular-nums"
            aria-invalid={ver("codigoPostal") ? true : undefined}
          />
          {ver("codigoPostal") && <p className="text-destructive text-xs">{ver("codigoPostal")}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="factura-razon">{datos.tipoPersona === "Moral" ? "Razón social" : "Nombre completo"}</Label>
        <Input
          id="factura-razon"
          value={datos.razonSocial}
          onChange={(e) => cambiar({ razonSocial: e.target.value })}
          maxLength={200}
          className="bg-card h-10"
          aria-invalid={ver("razonSocial") ? true : undefined}
        />
        <p className="text-muted-foreground-subtle text-xs">Tal como aparece en su constancia de situación fiscal.</p>
        {ver("razonSocial") && <p className="text-destructive text-xs">{ver("razonSocial")}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="factura-regimen">Régimen fiscal</Label>
          <Select value={datos.regimenFiscal} onValueChange={(v) => cambiar({ regimenFiscal: v as DatosFiscalesReceptor["regimenFiscal"] })}>
            <SelectTrigger id="factura-regimen" className="bg-card h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-72">
              {regimenesPara(datos.tipoPersona).map((r) => (
                <SelectItem key={r.valor} value={r.valor}>
                  <span className="text-muted-foreground mr-1 tabular-nums">{r.clave}</span> {r.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="factura-uso">Uso del CFDI</Label>
          <Select value={datos.usoCfdi} onValueChange={(v) => cambiar({ usoCfdi: v as DatosFiscalesReceptor["usoCfdi"] })}>
            <SelectTrigger id="factura-uso" className="bg-card h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-72">
              {USOS_CFDI.map((u) => (
                <SelectItem key={u.valor} value={u.valor}>
                  <span className="text-muted-foreground mr-1">{u.valor}</span> {u.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-surface-subtle grid grid-cols-3 gap-2 rounded-lg border px-3 py-2.5 text-sm tabular-nums">
        <div>
          <p className="text-muted-foreground text-xs">Subtotal</p>
          <p>{formatearMoneda(subtotal)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">IVA {tarifaIva}%</p>
          <p>{formatearMoneda(pago.monto - subtotal)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Total</p>
          <p className="text-foreground font-semibold">{formatearMoneda(pago.monto)}</p>
        </div>
      </div>
      <p className="text-muted-foreground-subtle -mt-2 text-xs">
        Recibo {pago.numeroRecibo} del {formatearFechaCorta(pago.fechaPago)}. El IVA se desglosa del monto cobrado.
      </p>

      {error && <AlertaFormulario>{error}</AlertaFormulario>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={emitir.isPending}>
          {textoCancelar}
        </Button>
        <Button type="submit" disabled={emitir.isPending}>
          {emitir.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}
          Emitir factura
        </Button>
      </div>
    </form>
  );
}
