import { useState } from "react";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";

import { EstadoError } from "@/components/states/estado-error";
import { Button } from "@/components/ui/button";
import { AlertaFormulario, GrupoCampos } from "@/components/ui/grupo-campos";
import { Input } from "@/components/ui/input";
import { InputUnidad } from "@/components/ui/input-unidad";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActualizarDatosClinica, useDatosClinica } from "@/features/cobros/hooks/use-cobros";
import { REGIMENES } from "@/features/cobros/lib/cobros";
import { mensajeDeError } from "@/lib/api-error";
import type { ActualizarDatosFiscalesClinicaDto, DatosFiscalesClinica, RegimenFiscal } from "@/types/api";

/** Datos de la clinica como emisor: salen en recibos y facturas. */
export function SeccionDatosFiscales() {
  const datos = useDatosClinica();

  if (datos.isPending) {
    return (
      <div className="hoja mx-auto max-w-3xl space-y-4 rounded-xl p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (datos.isError) {
    return (
      <EstadoError titulo="No pudimos cargar los datos fiscales" mensaje={mensajeDeError(datos.error)} onReintentar={datos.refetch} />
    );
  }
  return <Formulario inicial={datos.data} />;
}

const VACIO: ActualizarDatosFiscalesClinicaDto = {
  razonSocial: "",
  rfc: "",
  regimenFiscal: "GeneralDeLeyPersonasMorales",
  codigoPostal: "",
  direccion: "",
  telefono: null,
  correo: null,
  logoUrl: null,
  serie: "A",
  tarifaIva: 16,
};

function Formulario({ inicial }: { inicial: DatosFiscalesClinica | null }) {
  const guardar = useActualizarDatosClinica();
  const [datos, setDatos] = useState<ActualizarDatosFiscalesClinicaDto>(() =>
    inicial
      ? {
          razonSocial: inicial.razonSocial,
          rfc: inicial.rfc,
          regimenFiscal: inicial.regimenFiscal,
          codigoPostal: inicial.codigoPostal,
          direccion: inicial.direccion,
          telefono: inicial.telefono,
          correo: inicial.correo,
          logoUrl: inicial.logoUrl,
          serie: inicial.serie,
          tarifaIva: inicial.tarifaIva,
        }
      : VACIO,
  );
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const cambiar = (cambios: Partial<ActualizarDatosFiscalesClinicaDto>) => setDatos((d) => ({ ...d, ...cambios }));

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault();
    setErrorGeneral(null);
    guardar.mutate(
      {
        ...datos,
        rfc: datos.rfc.trim().toUpperCase(),
        telefono: datos.telefono?.trim() || null,
        correo: datos.correo?.trim() || null,
      },
      {
        onSuccess: () => toast.success("Datos fiscales guardados"),
        onError: (error) => setErrorGeneral(mensajeDeError(error)),
      },
    );
  };

  const campo = (
    clave: keyof ActualizarDatosFiscalesClinicaDto,
    etiqueta: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`clinica-${clave}`}>{etiqueta}</Label>
      <Input
        id={`clinica-${clave}`}
        value={(datos[clave] as string | null) ?? ""}
        onChange={(e) => cambiar({ [clave]: e.target.value })}
        className="bg-card h-10"
        {...props}
      />
    </div>
  );

  return (
    <form onSubmit={enviar} noValidate className="hoja mx-auto max-w-3xl space-y-6 rounded-xl p-5 md:p-6">
      {!inicial && (
        <AlertaFormulario>
          La clínica todavía no tiene datos fiscales: sin ellos no se pueden emitir facturas.
        </AlertaFormulario>
      )}

      <GrupoCampos titulo="Emisor" icono={Building2} descripcion="Aparece en recibos y facturas">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{campo("razonSocial", "Razón social", { maxLength: 200 })}</div>
          {campo("rfc", "RFC", { maxLength: 13, className: "bg-card h-10 font-mono uppercase" })}
          <div className="space-y-1.5">
            <Label htmlFor="clinica-regimen">Régimen fiscal</Label>
            <Select value={datos.regimenFiscal} onValueChange={(v) => cambiar({ regimenFiscal: v as RegimenFiscal })}>
              <SelectTrigger id="clinica-regimen" className="bg-card h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-72">
                {REGIMENES.map((r) => (
                  <SelectItem key={r.valor} value={r.valor}>
                    <span className="text-muted-foreground mr-1 tabular-nums">{r.clave}</span> {r.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">{campo("direccion", "Dirección", { maxLength: 300 })}</div>
          {campo("codigoPostal", "Código postal", { inputMode: "numeric", maxLength: 5 })}
          {campo("telefono", "Teléfono", { inputMode: "tel", maxLength: 30 })}
          <div className="sm:col-span-2">{campo("correo", "Correo", { type: "email", maxLength: 150 })}</div>
        </div>
      </GrupoCampos>

      <GrupoCampos titulo="Facturación" descripcion="Serie de los folios e IVA que se desglosa del monto cobrado">
        <div className="grid gap-4 sm:grid-cols-2">
          {campo("serie", "Serie", { maxLength: 10, className: "bg-card h-10 uppercase" })}
          <div className="space-y-1.5">
            <Label htmlFor="clinica-iva">Tasa de IVA</Label>
            <InputUnidad
              id="clinica-iva"
              unidad="%"
              inputMode="decimal"
              value={Number.isNaN(datos.tarifaIva) ? "" : datos.tarifaIva}
              onChange={(e) => cambiar({ tarifaIva: e.target.value === "" ? Number.NaN : Number(e.target.value) })}
            />
          </div>
        </div>
      </GrupoCampos>

      {errorGeneral && <AlertaFormulario>{errorGeneral}</AlertaFormulario>}

      <div className="flex justify-end">
        <Button type="submit" disabled={guardar.isPending}>
          {guardar.isPending && <Loader2 className="size-4 animate-spin" />}
          Guardar datos fiscales
        </Button>
      </div>
    </form>
  );
}
