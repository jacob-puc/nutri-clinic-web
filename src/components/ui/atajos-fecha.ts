export interface AtajoFecha {
  etiqueta: string
  /** Se evalua al abrir, para que "Mañana" sea siempre relativo a hoy. */
  fecha: () => Date
}

/** Atajos de agenda: lo que mas se agenda en consulta. */
export const ATAJOS_AGENDA: AtajoFecha[] = [
  { etiqueta: "Hoy", fecha: () => new Date() },
  {
    etiqueta: "Mañana",
    fecha: () => {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      return d
    },
  },
  {
    etiqueta: "En una semana",
    fecha: () => {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      return d
    },
  },
  {
    etiqueta: "En un mes",
    fecha: () => {
      const d = new Date()
      d.setMonth(d.getMonth() + 1)
      return d
    },
  },
]
