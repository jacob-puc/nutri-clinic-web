import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock, FileText, Loader2, Mail, Send, XCircle } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EnvioDocumento, TipoDocumento } from "@/features/envios/api/envios-api";
import { useEnviarDocumento, useEnvios } from "@/features/envios/hooks/use-envios";
import { usePaciente } from "@/features/pacientes/hooks/use-expediente";
import { mensajeDeError } from "@/lib/api-error";
import { formatearFechaHora } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Guid } from "@/types/api";

const TEXTO: Record<TipoDocumento, { titulo: string; adjunto: string; sugerencia: string }> = {
  plan: {
    titulo: "Enviar plan al paciente",
    adjunto: "El menú semanal en PDF",
    sugerencia: "Ej.: Ana, aquí tienes tu plan. Recuerda tomar 2 litros de agua al día.",
  },
  historial: {
    titulo: "Enviar historial clínico",
    adjunto: "El historial clínico en PDF",
    sugerencia: "Ej.: Te comparto tu historial para tu consulta con el médico.",
  },
  comprobante: {
    titulo: "Enviar comprobante de pago",
    adjunto: "El comprobante de pago en PDF",
    sugerencia: "Ej.: Gracias por tu visita.",
  },
  factura: {
    titulo: "Enviar factura",
    adjunto: "La factura en PDF",
    sugerencia: "Ej.: Adjunto la factura de tu consulta.",
  },
};

/**
 * Confirmacion antes de enviar un documento por correo. Muestra a quien
 * llega, que se adjunta y los envios anteriores, para no mandarlo dos
 * veces sin querer. El plan y el historial van siempre al correo del
 * paciente; el comprobante y la factura admiten otro destinatario.
 */
export function DialogoEnviarDocumento({
  abierto,
  onOpenChange,
  tipo,
  referenciaId,
  pacienteId,
  documento,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  tipo: TipoDocumento;
  referenciaId: Guid;
  pacienteId: Guid;
  /** Lo que se envia, en palabras: "Plan Reducción 1,800", "Recibo REC-2026-12". */
  documento: string;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {abierto && (
          <Contenido
            tipo={tipo}
            referenciaId={referenciaId}
            pacienteId={pacienteId}
            documento={documento}
            onCerrar={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({
  tipo,
  referenciaId,
  pacienteId,
  documento,
  onCerrar,
}: {
  tipo: TipoDocumento;
  referenciaId: Guid;
  pacienteId: Guid;
  documento: string;
  onCerrar: () => void;
}) {
  const paciente = usePaciente(pacienteId);
  const envios = useEnvios(referenciaId);
  const enviar = useEnviarDocumento(tipo, referenciaId);

  const editable = tipo === "comprobante" || tipo === "factura";
  const correoPaciente = paciente.data?.correoElectronico?.trim() || "";
  const [para, setPara] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState<string | null>(null);

  const destinatario = (para ?? correoPaciente).trim();
  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario);
  const sinCorreo = !paciente.isPending && !correoValido;
  const ultimo = envios.data?.[0];
  const texto = TEXTO[tipo];

  const confirmar = async () => {
    setError(null);
    try {
      const envio = await enviar.mutateAsync({
        mensaje: mensaje.trim() || null,
        para: editable && destinatario !== correoPaciente ? destinatario : null,
      });
      toast.success("Correo en camino", { description: `${documento} · ${envio.para}` });
      onCerrar();
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  };

  return (
    <>
      <DialogHeader icono={Send}>
        <DialogTitle>{texto.titulo}</DialogTitle>
        <DialogDescription>
          Revisa los datos antes de enviar. El paciente recibirá un correo con el diseño de la clínica.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="bg-surface-subtle flex items-start gap-3 rounded-xl border px-3.5 py-3">
          <span className="bg-primary-soft text-primary-soft-foreground grid size-9 shrink-0 place-items-center rounded-lg">
            <FileText className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-semibold">{documento}</p>
            <p className="text-muted-foreground text-xs">{texto.adjunto}, generado con los datos de este momento.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="enviar-para">Para</Label>
          {editable ? (
            <Input
              id="enviar-para"
              type="email"
              value={para ?? correoPaciente}
              onChange={(e) => setPara(e.target.value)}
              placeholder={paciente.isPending ? "Cargando…" : "correo@ejemplo.com"}
              className="bg-card h-10"
              aria-invalid={sinCorreo && destinatario !== "" ? true : undefined}
            />
          ) : (
            <div className="bg-card flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
              <Mail className="text-muted-foreground size-4" aria-hidden />
              {paciente.isPending ? (
                <span className="text-muted-foreground">Cargando…</span>
              ) : correoPaciente ? (
                <span className="truncate">
                  {correoPaciente}
                  <span className="text-muted-foreground"> · {paciente.data?.nombreCompleto}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Sin correo registrado</span>
              )}
            </div>
          )}
          {sinCorreo && (
            <p className="text-warning-soft-foreground flex items-center gap-1.5 text-xs font-medium">
              <AlertTriangle className="size-3.5" aria-hidden />
              {editable
                ? "Escribe un correo válido."
                : "El paciente no tiene un correo válido. Agrégalo en su expediente para poder enviarle documentos."}
            </p>
          )}
          {editable && !sinCorreo && destinatario !== correoPaciente && correoPaciente && (
            <p className="text-muted-foreground text-xs">Se enviará a este correo en lugar del del paciente.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="enviar-mensaje">
            Mensaje <span className="text-muted-foreground-subtle text-xs font-normal">(opcional)</span>
          </Label>
          <Textarea
            id="enviar-mensaje"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder={texto.sugerencia}
            maxLength={1000}
            rows={3}
            className="bg-card"
          />
          <p className="text-muted-foreground text-xs">Aparece dentro del correo, firmado con tu nombre.</p>
        </div>

        {ultimo && <EnviosAnteriores envios={envios.data ?? []} />}

        {error && <AlertaFormulario>{error}</AlertaFormulario>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="button" onClick={confirmar} disabled={enviar.isPending || sinCorreo || paciente.isPending}>
          {enviar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {ultimo ? "Enviar de nuevo" : "Enviar"}
        </Button>
      </DialogFooter>
    </>
  );
}

function EnviosAnteriores({ envios }: { envios: EnvioDocumento[] }) {
  return (
    <div className="space-y-1.5">
      <p className="text-foreground text-xs font-semibold">Ya se envió antes</p>
      <ul className="divide-border divide-y rounded-xl border">
        {envios.slice(0, 3).map((e) => (
          <li key={e.id} className="flex items-start gap-2.5 px-3 py-2 text-xs">
            <EstadoEnvio envio={e} />
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate font-medium">{e.para}</p>
              <p className="text-muted-foreground">
                {formatearFechaHora(e.fechaEnvio ?? e.fechaCreacion)}
                {e.enviadoPor ? ` · ${e.enviadoPor}` : ""}
              </p>
              {e.error && <p className="text-destructive mt-0.5">{e.error}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EstadoEnvio({ envio, conTexto = false }: { envio: EnvioDocumento; conTexto?: boolean }) {
  const { icono: Icono, clase, texto } = {
    Enviado: { icono: CheckCircle2, clase: "text-success", texto: "Enviado" },
    Pendiente: { icono: Clock, clase: "text-info", texto: "Enviando…" },
    Fallido: { icono: XCircle, clase: "text-destructive", texto: "No se pudo enviar" },
    Descartado: { icono: XCircle, clase: "text-muted-foreground", texto: "No enviado" },
  }[envio.estado];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 font-medium", clase)}>
      <Icono className="mt-px size-3.5" aria-label={texto} />
      {conTexto && texto}
    </span>
  );
}
