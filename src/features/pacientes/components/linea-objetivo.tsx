import { useState } from "react";

import { Progress } from "@/components/ui/progress";
import { DialogoObjetivo } from "@/features/pacientes/components/dialogo-objetivo";
import { useActualizarObjetivo } from "@/features/pacientes/hooks/use-mutaciones-paciente";
import type { MedidaAntropometrica, Paciente } from "@/types/api";

/**
 * Avance = recorrido hecho sobre recorrido total. El denominador sale negativo
 * en objetivos de subida de peso y la division se cancela sola, sin branching.
 */
export function calcularAvance(
  pesoInicial: number,
  pesoActual: number,
  pesoObjetivo: number,
) {
  const recorrido = pesoInicial - pesoObjetivo;
  if (recorrido === 0) return null;

  const crudo = ((pesoInicial - pesoActual) / recorrido) * 100;

  return {
    progreso: Math.min(100, Math.max(0, crudo)),
    alcanzado: crudo >= 100,
  };
}

export function LineaObjetivo({
  paciente,
  medidas,
}: {
  paciente: Paciente;
  medidas: MedidaAntropometrica[];
}) {
  const [editando, setEditando] = useState(false);
  const guardar = useActualizarObjetivo(paciente.id);

  const { tituloObjetivo, pesoObjetivo } = paciente;
  const definido = Boolean(tituloObjetivo) || pesoObjetivo !== null;

  const ordenadas = [...medidas].sort((a, b) =>
    a.fechaMedicion.localeCompare(b.fechaMedicion),
  );
  const inicial = ordenadas[0];
  const actual = ordenadas.at(-1);

  const avance =
    pesoObjetivo !== null && inicial && actual
      ? calcularAvance(inicial.peso, actual.peso, pesoObjetivo)
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-md text-sm underline-offset-4 transition-colors hover:underline focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="font-medium">Objetivo:</span>

        {!definido ? (
          <span className="text-muted-foreground/70 italic">sin definir</span>
        ) : (
          <span className="text-foreground">
            {tituloObjetivo ?? "Peso"}
            {pesoObjetivo !== null && ` · ${pesoObjetivo} kg`}
            {avance && ` · ${Math.round(avance.progreso)}%`}
          </span>
        )}
      </button>

      {avance && (
        <Progress
          value={avance.progreso}
          aria-label="Avance del objetivo de peso"
          className="mx-auto w-full max-w-xs [&>[data-slot=progress-indicator]]:bg-primary"
        />
      )}

      <DialogoObjetivo
        abierto={editando}
        onOpenChange={setEditando}
        paciente={paciente}
        onGuardar={(datos) => guardar.mutateAsync(datos)}
        guardando={guardar.isPending}
      />
    </>
  );
}
