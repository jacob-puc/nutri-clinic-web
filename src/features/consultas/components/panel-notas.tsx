import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, FileText, Loader2, NotebookPen, ReceiptText, Wallet } from "lucide-react";

import { AlertaFormulario } from "@/components/ui/grupo-campos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { formatearFechaLargaLocal, formatearHoraLocal } from "@/features/citas/lib/fechas-cita";
import { cobrosApi } from "@/features/cobros/api/cobros-api";
import { DialogoCobro } from "@/features/cobros/components/dialogo-cobro";
import { useFacturas, usePagoDeConsulta } from "@/features/cobros/hooks/use-cobros";
import { ETIQUETA_METODO, formatearMoneda } from "@/features/cobros/lib/cobros";
import { useCerrarConsulta } from "@/features/consultas/hooks/use-mutaciones-consulta";
import { mensajeDeError } from "@/lib/api-error";
import type { Consulta } from "@/types/api";

const claveBorrador = (consultaId: string) => `nutriclinica-notas-consulta-${consultaId}`;

/* El almacenamiento puede estar bloqueado (modo privado): el borrador es una
   comodidad, asi que cualquier fallo se ignora. */
function leerBorrador(consultaId: string): string | null {
  try {
    return localStorage.getItem(claveBorrador(consultaId));
  } catch {
    return null;
  }
}

function guardarBorrador(consultaId: string, texto: string) {
  try {
    if (texto.trim()) localStorage.setItem(claveBorrador(consultaId), texto);
    else localStorage.removeItem(claveBorrador(consultaId));
  } catch {
    /* sin borrador local */
  }
}

/**
 * Notas de la consulta, siempre a la vista en la columna derecha: se escriben
 * mientras se atiende, no al final. El cierre vive aqui mismo porque guardar
 * las notas y cerrar son un solo paso en el backend.
 *
 * El backend no expone un PUT de consulta, asi que las notas solo se envian
 * al cerrar. Mientras tanto se guardan como borrador en este navegador para
 * que una recarga o un cierre accidental de la pestaña no las pierda.
 */
export function PanelNotas({ consulta }: { consulta: Consulta }) {
  const navigate = useNavigate();
  /* El cobro vive aqui y no en NotasEnCurso: al cerrar, la consulta se
     refresca y el panel cambia a NotasCerradas, que desmontaria el dialogo. */
  const [cobrando, setCobrando] = useState<Consulta | null>(null);
  const [volverAlTerminar, setVolverAlTerminar] = useState(false);

  return (
    <>
      {consulta.fechaFin !== null ? (
        <NotasCerradas consulta={consulta} onCobrar={() => setCobrando(consulta)} />
      ) : (
        <NotasEnCurso
          consulta={consulta}
          onCerrada={(cerrada) => {
            setVolverAlTerminar(true);
            setCobrando(cerrada);
          }}
        />
      )}
      <DialogoCobro
        consulta={cobrando}
        onOpenChange={(abierto) => !abierto && setCobrando(null)}
        onTerminar={() => {
          /* Tras cerrar y cobrar se vuelve a la agenda o a la cola, como
             antes; si solo se cobro una consulta ya cerrada, se queda aqui. */
          if (volverAlTerminar) navigate(consulta.citaId ? "/citas" : "/consultas");
        }}
      />
    </>
  );
}

function NotasEnCurso({ consulta, onCerrada }: { consulta: Consulta; onCerrada: (cerrada: Consulta) => void }) {
  const cerrar = useCerrarConsulta(consulta.id, { navegar: false });
  const [notas, setNotas] = useState(() => leerBorrador(consulta.id) ?? consulta.notasClinicas ?? "");
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiarNotas = (texto: string) => {
    setNotas(texto);
    guardarBorrador(consulta.id, texto);
  };

  const alConfirmar = () => {
    setError(null);
    cerrar.mutate(
      { notasClinicas: notas.trim() || null },
      {
        onSuccess: (cerrada) => {
          guardarBorrador(consulta.id, "");
          setConfirmando(false);
          onCerrada(cerrada);
        },
        onError: (errorDeRed: unknown) => {
          setError(mensajeDeError(errorDeRed));
          setConfirmando(false);
        },
      },
    );
  };

  return (
    <div className="hoja flex flex-col rounded-xl p-4">
      <div className="flex items-center gap-2">
        <NotebookPen className="text-primary size-4" aria-hidden />
        <h2 className="text-foreground text-sm font-semibold">
          <label htmlFor="notas-consulta">Notas de la consulta</label>
        </h2>
      </div>

      <Textarea
        id="notas-consulta"
        placeholder="Evolución, hallazgos, indicaciones y plan para la próxima visita…"
        value={notas}
        onChange={(evento) => cambiarNotas(evento.target.value)}
        className="bg-card mt-3 min-h-44 flex-1 resize-y text-sm leading-relaxed lg:min-h-60"
      />
      <p className="text-muted-foreground-subtle mt-1.5 text-xs">
        Borrador guardado en este equipo · se registra al cerrar
      </p>

      {error && (
        <div className="mt-3">
          <AlertaFormulario>{error}</AlertaFormulario>
        </div>
      )}

      <Button className="mt-4 w-full" onClick={() => setConfirmando(true)} disabled={cerrar.isPending}>
        {cerrar.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        Cerrar consulta
      </Button>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar la consulta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se guardan las notas, se fija la hora de cierre y la cita pasa a{" "}
              <span className="text-foreground font-medium">Completada</span>. No se puede deshacer desde la app.
              {!notas.trim() && " Aún no escribiste notas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cerrar.isPending}>Volver</AlertDialogCancel>
            <AlertDialogAction
              disabled={cerrar.isPending}
              onClick={(e) => {
                e.preventDefault();
                alConfirmar();
              }}
            >
              {cerrar.isPending && <Loader2 className="size-4 animate-spin" />}
              Cerrar consulta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NotasCerradas({ consulta, onCobrar }: { consulta: Consulta; onCobrar: () => void }) {
  return (
    <div className="hoja rounded-xl p-4">
      <div className="flex items-center gap-2">
        <NotebookPen className="text-primary size-4" aria-hidden />
        <h2 className="text-foreground text-sm font-semibold">Notas de la consulta</h2>
      </div>
      {consulta.notasClinicas ? (
        <p className="text-foreground mt-3 text-sm leading-relaxed whitespace-pre-wrap">{consulta.notasClinicas}</p>
      ) : (
        <p className="text-muted-foreground mt-3 text-sm">No se dejaron notas.</p>
      )}
      <p className="text-muted-foreground border-border mt-4 border-t pt-3 text-xs">
        Cerrada el {formatearFechaLargaLocal(consulta.fechaFin)} · {formatearHoraLocal(consulta.fechaFin)}
      </p>
      <EstadoCobro consulta={consulta} onCobrar={onCobrar} />
    </div>
  );
}

/** Si la consulta ya se cobro (y facturo) o sigue pendiente, con su accion. */
function EstadoCobro({ consulta, onCobrar }: { consulta: Consulta; onCobrar: () => void }) {
  const { pago, isPending } = usePagoDeConsulta(consulta.id);
  const facturas = useFacturas({ pacienteId: consulta.pacienteId }, { enabled: Boolean(pago) });
  const factura = pago ? facturas.data?.find((f) => f.pagoId === pago.id && f.estatus !== "Anulada") : undefined;

  const abrir = (accion: () => Promise<void>) =>
    accion().catch((error) => toast.error("No se pudo abrir el PDF", { description: mensajeDeError(error) }));

  if (isPending) return null;

  if (!pago) {
    return (
      <div className="bg-warning-soft text-warning-soft-foreground mt-3 flex items-center justify-between gap-2 rounded-lg px-3 py-2">
        <span className="text-sm font-medium">Por cobrar</span>
        <Button size="sm" onClick={onCobrar}>
          <Wallet className="size-4" />
          Cobrar
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-success-soft text-success-soft-foreground mt-3 space-y-2 rounded-lg px-3 py-2">
      <p className="text-sm">
        <span className="font-semibold">Pagado</span> · {formatearMoneda(pago.monto)} ·{" "}
        {ETIQUETA_METODO[pago.metodoPago]}
        <span className="block text-xs opacity-80">
          {pago.numeroRecibo}
          {factura && ` · Factura ${factura.serie}-${String(factura.folio).padStart(4, "0")}`}
        </span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" onClick={() => abrir(() => cobrosApi.abrirComprobante(pago.id))}>
          <ReceiptText className="size-4" />
          Recibo
        </Button>
        {factura ? (
          <Button size="sm" variant="outline" onClick={() => abrir(() => cobrosApi.abrirFacturaPdf(factura.id))}>
            <FileText className="size-4" />
            Factura
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onCobrar}>
            <FileText className="size-4" />
            Facturar
          </Button>
        )}
      </div>
    </div>
  );
}
