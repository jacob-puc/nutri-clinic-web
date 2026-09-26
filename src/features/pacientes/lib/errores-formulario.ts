import { ApiError, esApiError } from "@/lib/api-error";

const CAMPO_A_FORM: Readonly<Record<string, string>> = {
  NombreCompleto: "nombreCompleto",
  Direccion: "direccion",
  Telefono: "telefono",
  CorreoElectronico: "correoElectronico",
  FechaNacimiento: "fechaNacimiento",
  Sexo: "sexo",
};

export function erroresPorCampo(error: unknown): Record<string, string> {
  if (!esApiError(error)) return {};

  const resultado: Record<string, string> = {};

  for (const detalle of error.detalles) {
    const campo = CAMPO_A_FORM[detalle.campo];
    if (campo && !resultado[campo]) {
      resultado[campo] = detalle.mensaje;
    }
  }

  return resultado;
}

export function esConflicto(error: unknown): error is ApiError {
  return esApiError(error) && error.codigo === "CONFLICTO";
}

export function mensajeDeConflicto(error: unknown): string | null {
  if (!esConflicto(error)) return null;
  return error.message;
}
