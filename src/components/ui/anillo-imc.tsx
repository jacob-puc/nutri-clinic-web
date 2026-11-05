import { categoriaImc } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/* Extremos de la escala: mas alla de ellos el anillo queda vacio o lleno. */
const IMC_MINIMO = 15;
const IMC_MAXIMO = 40;

const COLOR_TONO = {
  success: "var(--success)",
  info: "var(--info)",
  warning: "var(--warning)",
  destructive: "var(--destructive)",
} as const;

const PASTILLA_TONO = {
  success: "bg-success-soft text-success-soft-foreground",
  info: "bg-info-soft text-info-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
  destructive: "bg-destructive-soft text-destructive-soft-foreground",
} as const;

const fmt = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

/**
 * IMC como anillo: el arco marca su lugar en la escala de 15 a 40 y el color y
 * la etiqueta dicen la categoria de la OMS. No es un avance hacia una meta.
 * `trazo` cambia la animacion: dentro de `Revelar` se dibuja al entrar en pantalla.
 */
export function AnilloImc({
  imc,
  className,
  trazo = "anillo-dia",
}: {
  imc: number;
  /** Fija el tamaño; todo lo de adentro escala con el. */
  className?: string;
  trazo?: "anillo-dia" | "linea-dibujo";
}) {
  const categoria = categoriaImc(imc);
  const parte = Math.round(
    (Math.min(Math.max(imc, IMC_MINIMO), IMC_MAXIMO) - IMC_MINIMO) / (IMC_MAXIMO - IMC_MINIMO) * 100,
  );

  return (
    <div
      role="img"
      aria-label={`IMC ${fmt.format(imc)}, ${categoria.etiqueta}`}
      className={cn("relative aspect-square [container-type:inline-size]", className)}
    >
      <svg viewBox="0 0 120 120" aria-hidden className="size-full -rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted)" strokeWidth="9" />
        {parte > 0 && (
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={COLOR_TONO[categoria.tono]}
            strokeWidth="9"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${parte} 100`}
            className={trazo}
            style={{ "--parte": parte } as React.CSSProperties}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-content-center justify-items-center text-center">
        <p className="text-muted-foreground text-[8cqw]">IMC</p>
        <p className="font-editorial text-foreground text-[24cqw] leading-none tabular-nums">{fmt.format(imc)}</p>
        <p className={cn("mt-[3cqw] rounded-full px-[5cqw] py-[1cqw] text-[6.5cqw] font-medium whitespace-nowrap", PASTILLA_TONO[categoria.tono])}>
          {categoria.etiqueta}
        </p>
      </div>
    </div>
  );
}
