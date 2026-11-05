import { useState } from "react";
import { Clock, Loader2 } from "lucide-react";
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
import { AlertaFormulario, GrupoCampos } from "@/components/ui/grupo-campos";
import { Segmentado } from "@/components/ui/segmentado";
import { EditorHorario } from "@/features/nutricionistas/components/editor-horario";
import { useActualizarHorario } from "@/features/nutricionistas/hooks/use-nutricionistas";
import { problemaBloques, resumenSemana } from "@/features/nutricionistas/lib/horario";
import { mensajeDeError } from "@/lib/api-error";
import type { BloqueHorario, Horarios, Nutricionista } from "@/types/api";

const DURACIONES = [
  { valor: "30", etiqueta: "30 min" },
  { valor: "45", etiqueta: "45 min" },
  { valor: "60", etiqueta: "1 h" },
  { valor: "90", etiqueta: "1 h 30" },
];

/**
 * Horario de una persona: usa el general de la clinica o uno propio, y la
 * duracion con la que se le proponen las citas.
 */
export function DialogoHorario({
  abierto,
  onOpenChange,
  persona,
  horarios,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  persona: Nutricionista;
  horarios: Horarios;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        {abierto && <ContenidoPersona persona={persona} horarios={horarios} onCerrar={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ContenidoPersona({
  persona,
  horarios,
  onCerrar,
}: {
  persona: Nutricionista;
  horarios: Horarios;
  onCerrar: () => void;
}) {
  const actual = horarios.personas.find((p) => p.nutricionistaId === persona.id);
  const guardar = useActualizarHorario();
  const [propio, setPropio] = useState(actual?.horarioPropio ?? false);
  const [bloques, setBloques] = useState<BloqueHorario[]>(() =>
    actual?.horarioPropio ? actual.bloques : horarios.clinica,
  );
  const [duracion, setDuracion] = useState(String(actual?.duracionConsultaMinutos ?? 60));
  const [error, setError] = useState<string | null>(null);

  const enviar = async () => {
    setError(null);
    const problema = propio ? problemaBloques(bloques) : null;
    if (problema) return setError(problema);
    try {
      await guardar.mutateAsync({
        id: persona.id,
        dto: { horarioPropio: propio, duracionConsultaMinutos: Number(duracion), bloques: propio ? bloques : [] },
      });
      toast.success("Horario guardado", { description: persona.nombreCompleto });
      onCerrar();
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  const resumenClinica = resumenSemana(horarios.clinica);

  return (
    <>
      <DialogHeader icono={Clock}>
        <DialogTitle>Horario de {persona.nombreCompleto.split(" ")[0]}</DialogTitle>
        <DialogDescription>
          Al agendar solo se ofrecen horas dentro de este horario, y el sistema rechaza las que quedan fuera.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <GrupoCampos titulo="Horario">
          <Segmentado
            aria-label="Tipo de horario"
            value={propio ? "propio" : "clinica"}
            onChange={(v) => setPropio(v === "propio")}
            opciones={[
              { valor: "clinica", etiqueta: "El de la clínica" },
              { valor: "propio", etiqueta: "Horario propio" },
            ]}
          />
          {propio ? (
            <EditorHorario bloques={bloques} onChange={setBloques} />
          ) : (
            <div className="bg-surface-subtle rounded-xl border p-4 text-sm">
              <p className="text-muted-foreground text-xs">Horario general de la clínica</p>
              {resumenClinica.length === 0 ? (
                <p className="text-foreground mt-1">Sin configurar: se puede agendar a cualquier hora.</p>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {resumenClinica.map((fila) => (
                    <li key={fila} className="text-foreground tabular-nums">
                      {fila}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-muted-foreground mt-2 text-xs">Si la clínica cambia su horario, este cambia también.</p>
            </div>
          )}
        </GrupoCampos>

        <GrupoCampos titulo="Duración de la consulta" descripcion="La que se propone al agendarle una cita.">
          <Segmentado variante="chips" aria-label="Duración de la consulta" value={duracion} onChange={setDuracion} opciones={DURACIONES} />
        </GrupoCampos>

        {error && <AlertaFormulario>{error}</AlertaFormulario>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => void enviar()} disabled={guardar.isPending}>
          {guardar.isPending && <Loader2 className="size-4 animate-spin" />}
          Guardar horario
        </Button>
      </DialogFooter>
    </>
  );
}

