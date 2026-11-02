import type { TipoConsulta, TipoDocumento, TipoFoto } from "@/types/api";

/** Etiqueta legible de cada tipo de consulta, en tildes. */
export const ETIQUETA_TIPO_CONSULTA: Record<TipoConsulta, string> = {
  Inicial: "Inicial",
  Seguimiento: "Seguimiento",
  Ajuste: "Ajuste",
  Cierre: "Cierre",
};

/**
 * Pastilla suave por tipo, en la misma clave visual que los estados de cita:
 * fondo tenue y texto oscuro del mismo tono.
 */
export const ESTILO_TIPO_CONSULTA: Record<TipoConsulta, string> = {
  Inicial: "bg-info-soft text-info-soft-foreground",
  Seguimiento: "bg-primary-soft text-primary-soft-foreground",
  Ajuste: "bg-warning-soft text-warning-soft-foreground",
  Cierre: "bg-muted text-muted-foreground",
};

export const ETIQUETA_TIPO_FOTO: Record<TipoFoto, string> = {
  Frente: "Frente",
  Perfil: "Perfil",
  Espalda: "Espalda",
  Otro: "Otra toma",
};

export const ETIQUETA_TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  AnalisisLaboratorio: "Análisis de laboratorio",
  EstudioClinico: "Estudio clínico",
  RecetaMedica: "Receta médica",
  Otro: "Otro",
};

/** Formatos que el backend acepta para documentos. */
export const ACCEPT_DOCUMENTO = ".pdf,.jpg,.jpeg,.png,.webp";
