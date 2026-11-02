import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, CalendarOff, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectorFecha } from "@/components/ui/selector-fecha";
import { Sugerencias } from "@/components/ui/sugerencias";
import { usePermisos } from "@/features/auth/hooks/use-permisos";
import {
  useCrearAusencia,
  useNutricionistasQueAtienden,
  useReasignarCitas,
} from "@/features/nutricionistas/hooks/use-nutricionistas";
import { mensajeDeError } from "@/lib/api-error";
import { claveDeCalendario, formatearInstante, hoyCalendario } from "@/lib/zona-horaria";
import type { AusenciaCreada, Nutricionista } from "@/types/api";

const MOTIVOS = ["Vacaciones", "Congreso", "Incapacidad", "Asunto personal", "Capacitación"];

/**
 * Registrar dias sin atencion. Si ya habia citas en esas fechas no se borran:
 * se muestran al terminar para reasignarlas (si eres administrador) o
 * moverlas desde la agenda.
 */
export function DialogoAusencia({
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
  const crear = useCrearAusencia();
  const hoy = hoyCalendario();
  const [desde, setDesde] = useState<Date | undefined>(hoy);
  const [hasta, setHasta] = useState<Date | undefined>(hoy);
  const [motivo, setMotivo] = useState("Vacaciones");
  const [error, setError] = useState<string | null>(null);
  const [creada, setCreada] = useState<AusenciaCreada | null>(null);

  if (creada && creada.citasAfectadas.length > 0) {
    return <CitasAfectadas persona={persona} creada={creada} onCerrar={onCerrar} />;
  }

  const enviar = async () => {
    setError(null);
    if (!desde || !hasta) return setError("Elige las dos fechas.");
    if (hasta < desde) return setError("La fecha final no puede ser anterior a la inicial.");
    try {
      const resultado = await crear.mutateAsync({
        id: persona.id,
        dto: { fechaInicio: claveDeCalendario(desde), fechaFin: claveDeCalendario(hasta), motivo: motivo.trim() || null },
      });
      toast.success("Ausencia registrada", { description: persona.nombreCompleto });
      if (resultado.citasAfectadas.length === 0) onCerrar();
      else setCreada(resultado);
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  return (
    <>
      <DialogHeader icono={CalendarOff}>
        <DialogTitle>Registrar ausencia</DialogTitle>
        <DialogDescription>
          Esos días no se podrán agendar citas con {persona.nombreCompleto.split(" ")[0]}.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ausencia-desde">Desde</Label>
            <SelectorFecha
              id="ausencia-desde"
              value={desde}
              onChange={(f) => {
                setDesde(f);
                if (f && hasta && hasta < f) setHasta(f);
              }}
              desde={hoy}
              formato="corto"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ausencia-hasta">Hasta (incluido)</Label>
            <SelectorFecha id="ausencia-hasta" value={hasta} onChange={setHasta} desde={desde ?? hoy} formato="corto" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ausencia-motivo">Motivo</Label>
          <Sugerencias etiqueta="Motivos frecuentes" opciones={MOTIVOS} valor={motivo} onElegir={setMotivo} />
          <Input
            id="ausencia-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={150}
            placeholder="Opcional"
            className="bg-card h-10"
          />
        </div>

        {error && <AlertaFormulario>{error}</AlertaFormulario>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => void enviar()} disabled={crear.isPending}>
          {crear.isPending && <Loader2 className="size-4 animate-spin" />}
          Registrar
        </Button>
      </DialogFooter>
    </>
  );
}

function CitasAfectadas({
  persona,
  creada,
  onCerrar,
}: {
  persona: Nutricionista;
  creada: AusenciaCreada;
  onCerrar: () => void;
}) {
  const { gestionarEquipo } = usePermisos();
  const equipo = useNutricionistasQueAtienden();
  const reasignar = useReasignarCitas();
  const [destinoId, setDestinoId] = useState("");
  const [pendientes, setPendientes] = useState(creada.citasAfectadas);
  const [error, setError] = useState<string | null>(null);
  const candidatos = (equipo.data ?? []).filter((p) => p.id !== persona.id);

  const mover = async () => {
    setError(null);
    try {
      const r = await reasignar.mutateAsync({
        id: persona.id,
        destinoId,
        rango: { desde: creada.ausencia.fechaInicio, hasta: creada.ausencia.fechaFin },
      });
      const conflictos = new Set(r.conflictos.map((c) => c.id));
      setPendientes((lista) => lista.filter((c) => conflictos.has(c.id)));
      if (r.reasignadas > 0) toast.success(`${r.reasignadas} ${r.reasignadas === 1 ? "cita reasignada" : "citas reasignadas"}`);
      if (r.conflictos.length === 0) onCerrar();
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  return (
    <>
      <DialogHeader icono={CalendarClock}>
        <DialogTitle>Hay citas en esas fechas</DialogTitle>
        <DialogDescription>
          La ausencia quedó registrada, pero estas citas siguen a nombre de {persona.nombreCompleto.split(" ")[0]}.
        </DialogDescription>
      </DialogHeader>

      <ul className="divide-border/70 divide-y rounded-lg border">
        {pendientes.map((cita) => (
          <li key={cita.id}>
            <Link to={`/citas/${cita.id}`} className="hover:bg-accent group flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="text-foreground block truncate font-medium">{cita.pacienteNombre}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {formatearInstante(cita.fechaInicio, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </span>
              <ArrowRight className="text-muted-foreground size-4 opacity-0 group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>

      {gestionarEquipo && candidatos.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="ausencia-destino">Pasarlas a</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={destinoId} onValueChange={setDestinoId}>
              <SelectTrigger id="ausencia-destino" className="bg-card h-10 w-full sm:flex-1">
                <SelectValue placeholder="Elige quién las atenderá" />
              </SelectTrigger>
              <SelectContent>
                {candidatos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombreCompleto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" className="h-10" onClick={() => void mover()} disabled={!destinoId || reasignar.isPending}>
              {reasignar.isPending && <Loader2 className="size-4 animate-spin" />}
              Reasignar
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Las que choquen con la agenda u horario de esa persona se quedan aquí para moverlas a mano.
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Ábrelas para cambiarles el día o cancelarlas.</p>
      )}

      {error && <AlertaFormulario>{error}</AlertaFormulario>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar}>
          Lo resuelvo después
        </Button>
      </DialogFooter>
    </>
  );
}
