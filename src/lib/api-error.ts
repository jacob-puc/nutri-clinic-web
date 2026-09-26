export type ApiErrorCode =
  | "NO_ENCONTRADO"
  | "VALIDACION"
  | "CONFLICTO"
  | "ERROR_BD"
  | "ERROR_INTERNO"
  | "ERROR_DE_RED"
  | "ERROR_DESCONOCIDO";

export interface ApiErrorDetail {
  campo: string;
  mensaje: string;
}

interface MiddlewareErrorBody {
  codigo?: unknown;
  mensaje?: unknown;
  errores?: unknown;
}

interface AspNetValidationBody {
  title?: unknown;
  errors?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly codigo: ApiErrorCode;
  readonly detalles: ApiErrorDetail[];

  constructor(
    message: string,
    options: {
      status: number;
      codigo: ApiErrorCode;
      detalles?: ApiErrorDetail[];
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.codigo = options.codigo;
    this.detalles = options.detalles ?? [];
  }

  get primerDetalle(): string | undefined {
    return this.detalles[0]?.mensaje;
  }

  get esRed(): boolean {
    return this.codigo === "ERROR_DE_RED";
  }
}

const CODIGOS_VALIDOS: ReadonlySet<string> = new Set<ApiErrorCode>([
  "NO_ENCONTRADO",
  "VALIDACION",
  "CONFLICTO",
  "ERROR_BD",
  "ERROR_INTERNO",
  "ERROR_DE_RED",
  "ERROR_DESCONOCIDO",
]);

export function esApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function extraerDetallesDeAspNet(
  errors: unknown,
): ApiErrorDetail[] {
  if (typeof errors !== "object" || errors === null) return [];

  return Object.entries(errors as Record<string, unknown>).flatMap(
    ([campo, valor]) => {
      const mensajes = Array.isArray(valor)
        ? valor.map(String)
        : [String(valor)];
      return mensajes.map((mensaje) => ({ campo, mensaje }));
    },
  );
}

function aCadena(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim().length > 0 ? valor : null;
}

export function construirApiError(status: number, cuerpo: unknown): ApiError {
  if (cuerpo === null || cuerpo === undefined) {
    return new ApiError(`Error ${status} sin cuerpo de respuesta.`, {
      status,
      codigo: "ERROR_DESCONOCIDO",
    });
  }

  if (typeof cuerpo === "object") {
    const cuerpoMedio = cuerpo as MiddlewareErrorBody & AspNetValidationBody;

    const codigo = aCadena(cuerpoMedio.codigo);
    if (codigo && CODIGOS_VALIDOS.has(codigo)) {
      const detalles = Array.isArray(cuerpoMedio.errores)
        ? cuerpoMedio.errores.flatMap((item) => {
            if (typeof item !== "object" || item === null) return [];
            const detalle = item as Partial<ApiErrorDetail>;
            const campo = aCadena(detalle.campo);
            const mensaje = aCadena(detalle.mensaje);
            return campo && mensaje ? [{ campo, mensaje }] : [];
          })
        : [];

      return new ApiError(
        aCadena(cuerpoMedio.mensaje) ?? `Error ${status}.`,
        {
          status,
          codigo: codigo as ApiErrorCode,
          detalles,
        },
      );
    }

    if (cuerpoMedio.errors !== undefined) {
      const detalles = extraerDetallesDeAspNet(cuerpoMedio.errors);
      return new ApiError(
        aCadena(cuerpoMedio.title) ?? "Datos invalidos.",
        { status, codigo: "VALIDACION", detalles },
      );
    }
  }

  if (typeof cuerpo === "string" && cuerpo.trim().length > 0) {
    return new ApiError(cuerpo, {
      status,
      codigo: status === 404 ? "NO_ENCONTRADO" : "ERROR_DESCONOCIDO",
    });
  }

  return new ApiError(`Error ${status} en la solicitud.`, {
    status,
    codigo: "ERROR_DESCONOCIDO",
  });
}

export function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.esRed) {
      return "No pudimos conectar con el servidor. Revisa que la API este corriendo.";
    }
    return error.primerDetalle ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return "Ocurrio un error inesperado.";
}
