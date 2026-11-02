import { hoyCalendario } from "@/lib/zona-horaria"

export interface AtajoFecha {
  etiqueta: string
  /** Se evalua al abrir, para que "Mañana" sea siempre relativo a hoy. */
  fecha: () => Date
}

/** Atajos de agenda: lo que mas se agenda en consulta. */
export const ATAJOS_AGENDA: AtajoFecha[] = [
  { etiqueta: "Hoy", fecha: () => hoyCalendario() },
  {
    etiqueta: "Mañana",
    fecha: () => {
      const d = hoyCalendario()
      d.setDate(d.getDate() + 1)
      return d
    },
  },
  {
    etiqueta: "En una semana",
    fecha: () => {
      const d = hoyCalendario()
      d.setDate(d.getDate() + 7)
      return d
    },
  },
  {
    etiqueta: "En un mes",
    fecha: () => {
      const d = hoyCalendario()
      d.setMonth(d.getMonth() + 1)
      return d
    },
  },
]
