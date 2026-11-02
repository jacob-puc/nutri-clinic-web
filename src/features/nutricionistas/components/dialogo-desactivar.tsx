import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, Loader2, UserX } from "lucide-react";
import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarPersona } from "@/features/nutricionistas/components/comunes";
import {
  useCitasPendientesNutricionista,
  useDesactivarNutricionista,
  useNutricionistasQueAtienden,
  useReasignarCitas,
} from "@/features/nutricionistas/hooks/use-nutricionistas";
import { mensajeDeError } from "@/lib/api-error";
import { formatearInstante } from "@/lib/zona-horaria";
import type { CitaPendiente, Nutricionista, ResultadoReasignacion } from "@/types/api";

/**
 * Desactivar una cuenta. Si todavia tiene citas por atender, primero hay que
 * moverlas a otra persona: el boton de desactivar no se habilita hasta que
 * su agenda quede vacia (el backend aplica la misma regla).
 */
export function DialogoDesactivar({
  abierto,
  onOpenChange,
  persona,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  persona: Nutricionista;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {abierto && <Contenido persona={persona} onCerrar={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({ persona, onCerrar }: { persona: Nutricionista; onCerrar: () => void }) {
  const pendientes = useCitasPendientesNutricionista(persona.id);
  const equipo = useNutricionistasQueAtienden();
  const reasignar = useReasignarCitas();
  const desactivar = useDesactivarNutricionista();
  const [destinoId, setDestinoId] = useState("");
  const [resultado, setResultado] = useState<ResultadoReasignacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const citas = pendientes.data ?? [];
  const candidatos = (equipo.data ?? []).filter((p) => p.id !== persona.id);
  const nombre = persona.nombreCompleto.split(" ")[0];

  const moverCitas = async () => {
    if (!destinoId) return;
    setError(null);
    try {
      const r = await reasignar.mutateAsync({ id: persona.id, destinoId });
      setResultado(r);
      const destino = candidatos.find((c) => c.id === destinoId)?.nombreCompleto ?? "";
      if (r.reasignadas > 0) {
        toast.success(`${r.reasignadas} ${r.reasignadas === 1 ? "cita reasignada" : "citas reasignadas"}`, {
          description: `Ahora las atiende ${destino}.`,
        });
      }
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  const confirmar = async () => {
    setError(null);
    try {
      await desactivar.mutateAsync(persona.id);
      toast.success("Cuenta desactivada", { description: `${persona.nombreCompleto} ya no puede iniciar sesión.` });
      onCerrar();
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  return (
    <>
      <DialogHeader icono={UserX} tono="destructivo">
        <DialogTitle>Desactivar a {persona.nombreCompleto}</DialogTitle>
        <DialogDescription>
          Ya no podrá iniciar sesión ni recibir citas. Su historial de consultas se conserva y puedes reactivarla
          después.
        </DialogDescription>
      </DialogHeader>

      {pendientes.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : citas.length === 0 ? (
        <p className="bg-success-soft text-success-soft-foreground rounded-lg px-3 py-2.5 text-sm">
          No tiene citas pendientes: se puede desactivar.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="bg-warning-soft text-warning-soft-foreground flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm">
            <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              {nombre} tiene{" "}
              <strong>
                {citas.length} {citas.length === 1 ? "cita pendiente" : "citas pendientes"}
              </strong>
              . Reasígnalas antes de desactivar la cuenta.
            </p>
          </div>

          <ListaCitas citas={citas} />

          {candidatos.length === 0 ? (
            <AlertaFormulario>
              No hay otra persona activa que atienda pacientes. Agrega a alguien al equipo o cancela esas citas desde
              la agenda.
            </AlertaFormulario>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="destino-citas">Pasarlas a</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={destinoId} onValueChange={setDestinoId}>
                  <SelectTrigger id="destino-citas" className="bg-card h-10 w-full sm:flex-1">
                    <SelectValue placeholder="Elige quién las atenderá" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidatos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <AvatarPersona nombre={c.nombreCompleto} id={c.id} className="size-5 text-[9px]" />
                          {c.nombreCompleto}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => void moverCitas()}
                  disabled={!destinoId || reasignar.isPending}
                  className="h-10"
                >
                  {reasignar.isPending && <Loader2 className="size-4 animate-spin" />}
                  Reasignar
                </Button>
              </div>
              {resultado && resultado.conflictos.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  {resultado.conflictos.length === 1 ? "Una cita choca" : `${resultado.conflictos.length} citas chocan`}{" "}
                  con la agenda de esa persona: muévelas de horario desde la agenda o elige a alguien más.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && <AlertaFormulario>{error}</AlertaFormulario>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void confirmar()}
          disabled={pendientes.isPending || citas.length > 0 || desactivar.isPending}
        >
          {desactivar.isPending && <Loader2 className="size-4 animate-spin" />}
          Desactivar cuenta
        </Button>
      </DialogFooter>
    </>
  );
}

function ListaCitas({ citas }: { citas: CitaPendiente[] }) {
  const visibles = citas.slice(0, 5);
  return (
    <ul className="divide-border/70 divide-y rounded-lg border">
      {visibles.map((cita) => (
        <li key={cita.id}>
          <Link
            to={`/citas/${cita.id}`}
            className="hover:bg-accent group flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors"
          >
            <span className="min-w-0">
              <span className="text-foreground block truncate font-medium">{cita.pacienteNombre}</span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {formatearInstante(cita.fechaInicio, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>
            <ArrowRight className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        </li>
      ))}
      {citas.length > visibles.length && (
        <li className="text-muted-foreground px-3 py-2 text-xs">y {citas.length - visibles.length} más…</li>
      )}
    </ul>
  );
}
