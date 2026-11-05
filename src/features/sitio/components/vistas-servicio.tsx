import { AlertTriangle, Check, Clock, Stethoscope, TrendingDown } from "lucide-react";

import { cn } from "@/lib/utils";

/*
 * Escenas del sistema para los bloques de servicios. Van dibujadas con el diseño
 * de la app y datos de ejemplo: nunca salen de pacientes reales. Son decorativas,
 * el titulo y el texto del bloque dicen lo mismo. Ocupan el pie del bloque y se
 * salen por abajo, recortadas por el borde redondeado.
 */

export type VistaServicio = "medidas" | "plan" | "clinica" | "seguimiento";

const PANEL = "bg-card border-border/60 shadow-[0_18px_40px_-24px_rgb(10_40_38/0.45)] border";

/* ---------- Composicion corporal: medidor de IMC ---------- */

function Dato({ etiqueta, valor, className }: { etiqueta: string; valor: string; className?: string }) {
  return (
    <div className={cn(PANEL, "escena-pieza absolute rounded-2xl px-4 py-2.5", className)}>
      <p className="text-muted-foreground text-xs">{etiqueta}</p>
      <p className="text-foreground text-lg font-bold tabular-nums">{valor}</p>
    </div>
  );
}

function EscenaMedidas() {
  return (
    <div className="relative h-72 sm:h-80">
      <div className={cn(PANEL, "absolute -bottom-20 left-1/2 aspect-square w-[21rem] -translate-x-1/2 rounded-full p-7")}>
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted)" strokeWidth="9" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="9"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="52 100"
            className="linea-dibujo"
          />
        </svg>
        <div className="absolute inset-x-0 top-[23%] text-center">
          <p className="text-muted-foreground text-sm">IMC</p>
          <p className="font-editorial text-foreground text-6xl leading-none">24.1</p>
          <p className="bg-success-soft text-success-soft-foreground mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-medium">
            Normal
          </p>
        </div>
      </div>
      <Dato etiqueta="Peso" valor="72.4 kg" className="top-4 left-[4%] -rotate-3" />
      <Dato etiqueta="Grasa" valor="24 %" className="top-10 right-[4%] rotate-3" />
      <Dato etiqueta="Cintura" valor="81 cm" className="bottom-6 left-[1%] rotate-2" />
    </div>
  );
}

/* ---------- Plan de alimentacion: semana y menu del dia ---------- */

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const SEMANA = [
  { tiempo: "Desayuno", dias: [1, 1, 2, 1, 1, 1, 0] },
  { tiempo: "Colación", dias: [1, 0, 1, 1, 0, 1, 0] },
  { tiempo: "Comida", dias: [2, 1, 1, 2, 1, 2, 1] },
  { tiempo: "Cena", dias: [1, 1, 1, 1, 2, 0, 1] },
];
const MENU = [
  { tiempo: "Desayuno", plato: "Avena con fruta" },
  { tiempo: "Comida", plato: "Pollo con arroz" },
  { tiempo: "Cena", plato: "Ensalada de atún" },
];

function EscenaPlan() {
  return (
    <div className="relative h-72 sm:h-80">
      <div className={cn(PANEL, "absolute top-2 -bottom-8 left-6 w-[calc(100%-3rem)] rounded-t-2xl p-5 sm:left-10 sm:w-[calc(100%-15.5rem)] sm:p-6")}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-foreground font-semibold">Plan semanal</p>
          <p className="bg-success-soft text-success-soft-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">Activo</p>
        </div>
        <div className="grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))] items-center gap-1.5">
          <span />
          {DIAS.map((dia, i) => (
            <span key={i} className={cn("text-center text-xs font-semibold", i === 3 ? "text-primary" : "text-muted-foreground")}>
              {dia}
            </span>
          ))}
          {SEMANA.map((fila) => (
            <div key={fila.tiempo} className="contents">
              <span className="text-muted-foreground text-xs">{fila.tiempo}</span>
              {fila.dias.map((n, i) => (
                <span key={i} className={cn("h-8 rounded-md", n === 0 ? "bg-muted" : n === 1 ? "bg-primary/40" : "bg-primary/80")} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Telefono: el mismo plan como lo recibe el paciente. */}
      <div className="escena-pieza border-foreground/85 bg-card absolute top-10 right-5 -bottom-8 hidden w-48 rounded-t-[2rem] border-[6px] border-b-0 p-4 shadow-[0_24px_46px_-20px_rgb(10_40_38/0.6)] sm:block lg:right-8">
        <p className="text-primary text-xs font-semibold">Hoy · Jueves</p>
        <div className="mt-3 space-y-2.5">
          {MENU.map((m) => (
            <div key={m.tiempo} className="bg-background/70 rounded-xl px-3 py-2">
              <p className="text-muted-foreground text-[11px]">{m.tiempo}</p>
              <p className="text-foreground text-sm leading-tight font-medium">{m.plato}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Nutricion clinica: expediente con alerta ---------- */

function EscenaClinica() {
  return (
    <div className="relative h-72 sm:h-80">
      <div className={cn(PANEL, "absolute top-8 right-6 -bottom-12 left-6 -rotate-2 rounded-t-3xl p-6 sm:right-10 sm:left-10")}>
        <div className="flex items-center gap-3">
          <span className="bg-primary-soft text-primary-soft-foreground grid size-11 place-items-center rounded-full">
            <Stethoscope className="size-5" />
          </span>
          <div>
            <p className="text-foreground font-semibold">Historial clínico</p>
            <p className="text-muted-foreground text-sm">Diabetes tipo 2</p>
          </div>
        </div>
        <div className="mt-5 space-y-2.5">
          {["Bajo en sodio", "Control de glucosa", "Sin azúcares añadidos"].map((texto) => (
            <p key={texto} className="text-foreground flex items-center gap-2.5 text-[15px]">
              <span className="bg-success-soft text-success-soft-foreground grid size-6 shrink-0 place-items-center rounded-full">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              {texto}
            </p>
          ))}
        </div>
      </div>
      <p className="escena-pieza bg-destructive-soft text-destructive-soft-foreground border-destructive/20 absolute top-2 right-4 flex rotate-3 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-lg">
        <AlertTriangle className="size-4 shrink-0" />
        Alergia: nueces
      </p>
    </div>
  );
}

/* ---------- Seguimiento: la curva llena el ancho del bloque ---------- */

function EscenaSeguimiento() {
  return (
    <div className="relative h-72 sm:h-80">
      <svg viewBox="0 0 700 300" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id="relleno-seguimiento" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--primary)" stopOpacity="0.32" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 60 C90 66 130 96 230 118 S370 150 450 182 S610 206 700 226 V300 H0 Z" fill="url(#relleno-seguimiento)" />
        <line x1="0" y1="254" x2="700" y2="254" stroke="var(--foreground)" strokeOpacity="0.4" strokeDasharray="7 7" vectorEffect="non-scaling-stroke" />
        <path
          d="M0 60 C90 66 130 96 230 118 S370 150 450 182 S610 206 700 226"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100 100"
          className="linea-dibujo"
        />
      </svg>

      <div className={cn(PANEL, "escena-pieza absolute top-8 left-8 rounded-2xl px-5 py-3 sm:left-10")}>
        <p className="text-muted-foreground text-sm">Peso actual</p>
        <p className="font-editorial text-foreground text-4xl leading-tight">72.4 kg</p>
      </div>
      <p className="escena-pieza bg-success-soft text-success-soft-foreground absolute top-[45%] right-8 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-md">
        <TrendingDown className="size-4" />
        −3.2 kg en 8 semanas
      </p>
      <p className="text-foreground/70 absolute right-8 bottom-3 flex items-center gap-1.5 text-sm">
        <Clock className="size-3.5" /> Objetivo: 70 kg
      </p>
    </div>
  );
}

const ESCENAS: Record<VistaServicio, () => React.JSX.Element> = {
  medidas: EscenaMedidas,
  plan: EscenaPlan,
  clinica: EscenaClinica,
  seguimiento: EscenaSeguimiento,
};

export function VistaDeServicio({ vista }: { vista: VistaServicio }) {
  const Escena = ESCENAS[vista];
  return (
    <div aria-hidden className="mt-auto">
      <Escena />
    </div>
  );
}
