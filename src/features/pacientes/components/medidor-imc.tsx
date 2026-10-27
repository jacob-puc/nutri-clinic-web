import { categoriaImc } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/* Escala visible de 15 a 40: cubre casi todos los casos de consulta. Fuera
   de ella el marcador se queda en el borde, y la cifra sigue siendo exacta. */
const MIN = 15;
const MAX = 40;

const ZONAS = [
  { hasta: 18.5, fondo: "bg-info/35" },
  { hasta: 25, fondo: "bg-success/40" },
  { hasta: 30, fondo: "bg-warning/40" },
  { hasta: MAX, fondo: "bg-destructive/35" },
];

const CORTES = [18.5, 25, 30];

const TEXTO_TONO = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
} as const;

const posicion = (valor: number) =>
  `${((Math.min(Math.max(valor, MIN), MAX) - MIN) / (MAX - MIN)) * 100}%`;

/**
 * IMC calculado mientras se captura: cifra, categoria OMS y una regla con las
 * cuatro zonas donde un marcador indica en cual cae. La categoria va escrita,
 * asi que la zona de color nunca es la unica pista.
 */
export function MedidorImc({ imc }: { imc: number | null }) {
  const categoria = imc !== null ? categoriaImc(imc) : null;

  return (
    <div
      className="bg-surface-subtle rounded-lg border border-border px-3.5 py-3"
      aria-live="polite"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium">
          IMC calculado
        </p>
        {categoria && (
          <p className={cn("text-xs font-semibold", TEXTO_TONO[categoria.tono])}>
            {categoria.etiqueta}
          </p>
        )}
      </div>

      <p className="text-foreground mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">
        {imc !== null ? imc.toFixed(1) : "—"}
        {imc === null && (
          <span className="text-muted-foreground ml-2 text-xs font-normal tracking-normal">
            Captura peso y estatura
          </span>
        )}
      </p>

      <div className="relative mt-2.5" aria-hidden>
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
          {ZONAS.map((zona, i) => {
            const desde = i === 0 ? MIN : ZONAS[i - 1]!.hasta;
            return (
              <span
                key={zona.hasta}
                className={zona.fondo}
                style={{ flexGrow: zona.hasta - desde, flexBasis: 0 }}
              />
            );
          })}
        </div>

        {imc !== null && (
          <span
            className="bg-foreground ring-card absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 transition-[left] duration-300 ease-(--ease-out-soft)"
            style={{ left: posicion(imc) }}
          />
        )}

        <div className="text-muted-foreground-subtle relative mt-1 h-3.5 text-[10px] tabular-nums">
          {CORTES.map((corte) => (
            <span
              key={corte}
              className="absolute -translate-x-1/2"
              style={{ left: posicion(corte) }}
            >
              {corte}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
