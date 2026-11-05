import {
  formatearCalendario,
  hoyEnClinica,
  rangoDelDia,
  sumarDias,
  type ClaveDia,
} from "@/lib/zona-horaria";

export type TipoPeriodo = "dia" | "semana" | "mes" | "anio" | "rango";

/** `ancla` es un dia dentro del periodo; `desde`/`hasta` solo aplican a "rango". */
export interface Periodo {
  tipo: TipoPeriodo;
  ancla: ClaveDia;
  desde?: ClaveDia;
  hasta?: ClaveDia;
}

export interface PeriodoResuelto {
  /** Dias de calendario que cubre; nunca pasa de hoy. */
  inicio: ClaveDia;
  fin: ClaveDia;
  /** Los mismos limites como instantes, para filtrar en la API. */
  desde: string;
  hasta: string;
  etiqueta: string;
  esUnDia: boolean;
  /** El periodo incluye hoy. */
  esActual: boolean;
}

const partes = (clave: ClaveDia) => clave.split("-").map(Number) as [number, number, number];
const dos = (n: number) => String(n).padStart(2, "0");

export function lunesDe(clave: ClaveDia): ClaveDia {
  const [anio, mes, dia] = partes(clave);
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return sumarDias(clave, -((diaSemana + 6) % 7));
}

function limites({ tipo, ancla, desde, hasta }: Periodo, hoy: ClaveDia): [ClaveDia, ClaveDia] {
  const [anio, mes] = partes(ancla);
  switch (tipo) {
    case "semana": {
      const lunes = lunesDe(ancla);
      return [lunes, sumarDias(lunes, 6)];
    }
    case "mes": {
      const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
      return [`${anio}-${dos(mes)}-01`, `${anio}-${dos(mes)}-${dos(ultimo)}`];
    }
    case "anio":
      return [`${anio}-01-01`, `${anio}-12-31`];
    case "rango": {
      const a = desde ?? hoy;
      const b = hasta ?? hoy;
      return a <= b ? [a, b] : [b, a];
    }
    default:
      return [ancla, ancla];
  }
}

function etiquetaDe(tipo: TipoPeriodo, inicio: ClaveDia, finCompleto: ClaveDia, hoy: ClaveDia): string {
  const diaMes = { day: "numeric", month: "short" } as const;
  switch (tipo) {
    case "dia":
      return inicio === hoy
        ? `Hoy, ${formatearCalendario(inicio, { day: "numeric", month: "long" })}`
        : formatearCalendario(inicio, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    case "mes":
      return formatearCalendario(inicio, { month: "long", year: "numeric" });
    case "anio":
      return inicio.slice(0, 4);
    default: {
      const conAnio = { ...diaMes, year: "numeric" } as const;
      if (inicio === finCompleto) return formatearCalendario(inicio, conAnio);
      const mismoAnio = inicio.slice(0, 4) === finCompleto.slice(0, 4);
      return `${formatearCalendario(inicio, mismoAnio ? diaMes : conAnio)} – ${formatearCalendario(finCompleto, conAnio)}`;
    }
  }
}

/**
 * Convierte un periodo en limites concretos. Un periodo en curso termina hoy:
 * asi "este mes" se compara contra los mismos dias del periodo anterior y las
 * graficas no dibujan dias que aun no pasan.
 */
export function resolverPeriodo(periodo: Periodo): PeriodoResuelto {
  const hoy = hoyEnClinica();
  const [inicio, finCompleto] = limites(periodo, hoy);
  const fin = finCompleto > hoy ? hoy : finCompleto;
  return {
    inicio,
    fin,
    desde: rangoDelDia(inicio).desde,
    hasta: rangoDelDia(fin).hasta,
    etiqueta: etiquetaDe(periodo.tipo, inicio, fin, hoy),
    esUnDia: inicio === fin,
    esActual: inicio <= hoy && hoy <= finCompleto,
  };
}

/** El periodo anterior (-1) o siguiente (+1) del mismo tipo. */
export function moverPeriodo(periodo: Periodo, paso: 1 | -1): Periodo {
  const [anio, mes] = partes(periodo.ancla);
  switch (periodo.tipo) {
    case "semana":
      return { ...periodo, ancla: sumarDias(periodo.ancla, 7 * paso) };
    case "mes": {
      const fecha = new Date(Date.UTC(anio, mes - 1 + paso, 1));
      return { ...periodo, ancla: fecha.toISOString().slice(0, 10) };
    }
    case "anio":
      return { ...periodo, ancla: `${anio + paso}-01-01` };
    case "rango":
      return periodo;
    default:
      return { ...periodo, ancla: sumarDias(periodo.ancla, paso) };
  }
}
