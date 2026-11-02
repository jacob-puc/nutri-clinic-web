import { Copy, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SelectorHora } from "@/components/ui/selector-hora";
import { HORAS_15 } from "@/features/citas/lib/fechas-cita";
import {
  bloquesDelDia,
  DIAS,
  DIAS_HABILES,
  ETIQUETA_DIA,
  ETIQUETA_DIA_CORTA,
  minutosDeHora,
} from "@/features/nutricionistas/lib/horario";
import { cn } from "@/lib/utils";
import type { BloqueHorario, DiaSemana } from "@/types/api";

const HORAS = HORAS_15.filter((h) => h >= "06:00" && h <= "23:45");

function sumar(hora: string, minutos: number): string {
  const total = Math.min(minutosDeHora(hora) + minutos, 23 * 60 + 45);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Semana de atencion: cada dia con sus bloques (manana y tarde, p. ej.). Un
 * dia sin bloques es un dia sin atencion. "Copiar a dias habiles" replica el
 * lunes, que es lo que casi siempre se quiere.
 */
export function EditorHorario({
  bloques,
  onChange,
}: {
  bloques: BloqueHorario[];
  onChange: (bloques: BloqueHorario[]) => void;
}) {
  const delDia = (dia: DiaSemana) => bloquesDelDia(bloques, dia);

  const reemplazarDia = (dia: DiaSemana, nuevos: BloqueHorario[]) =>
    onChange([...bloques.filter((b) => b.diaSemana !== dia), ...nuevos]);

  const agregar = (dia: DiaSemana) => {
    const lista = delDia(dia);
    const ultimo = lista[lista.length - 1];
    const inicio = ultimo ? sumar(ultimo.horaFin, 60) : "09:00";
    reemplazarDia(dia, [...lista, { diaSemana: dia, horaInicio: inicio, horaFin: sumar(inicio, 4 * 60) }]);
  };

  const cambiar = (dia: DiaSemana, indice: number, cambios: Partial<BloqueHorario>) =>
    reemplazarDia(
      dia,
      delDia(dia).map((b, i) => (i === indice ? { ...b, ...cambios } : b)),
    );

  const quitar = (dia: DiaSemana, indice: number) =>
    reemplazarDia(
      dia,
      delDia(dia).filter((_, i) => i !== indice),
    );

  const lunes = delDia("Lunes");
  const copiarLunes = () =>
    onChange([
      ...bloques.filter((b) => !DIAS_HABILES.includes(b.diaSemana)),
      ...DIAS_HABILES.flatMap((dia) => lunes.map((b) => ({ ...b, diaSemana: dia }))),
    ]);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={copiarLunes} disabled={lunes.length === 0}>
          <Copy className="size-3.5" />
          Copiar el lunes a lunes–viernes
        </Button>
      </div>

      <ul className="divide-border/70 divide-y rounded-xl border">
        {DIAS.map((dia) => {
          const lista = delDia(dia);
          return (
            <li key={dia} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-start">
              <span
                className={cn(
                  "w-24 shrink-0 pt-2 text-sm font-medium",
                  lista.length === 0 ? "text-muted-foreground" : "text-foreground",
                )}
              >
                <span className="sm:hidden">{ETIQUETA_DIA[dia]}</span>
                <span className="hidden sm:inline">{ETIQUETA_DIA_CORTA[dia]}</span>
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {lista.length === 0 && (
                  <span className="text-muted-foreground-subtle pt-2 text-sm">Sin atención</span>
                )}
                {lista.map((bloque, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <SelectorHora
                      aria-label={`${ETIQUETA_DIA[dia]}, bloque ${i + 1}: empieza`}
                      value={bloque.horaInicio}
                      onChange={(hora) => cambiar(dia, i, { horaInicio: hora })}
                      horas={HORAS}
                      className="h-9 min-w-0 flex-1"
                    />
                    <span className="text-muted-foreground text-sm">a</span>
                    <SelectorHora
                      aria-label={`${ETIQUETA_DIA[dia]}, bloque ${i + 1}: termina`}
                      value={bloque.horaFin}
                      onChange={(hora) => cambiar(dia, i, { horaFin: hora })}
                      horas={HORAS.filter((h) => h > bloque.horaInicio)}
                      className="h-9 min-w-0 flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Quitar bloque de ${ETIQUETA_DIA[dia]}`}
                      onClick={() => quitar(dia, i)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start border-dashed"
                onClick={() => agregar(dia)}
                disabled={lista.length >= 6}
                aria-label={`Agregar bloque el ${ETIQUETA_DIA[dia]}`}
              >
                <Plus className="size-3.5" />
                <span className="sm:hidden lg:inline">{lista.length === 0 ? "Atender" : "Bloque"}</span>
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
