import type { RolUsuario } from "@/types/api";

/**
 * Que puede hacer cada rol. Es espejo de los [Authorize(Roles)] del backend,
 * que es quien manda: aqui solo se esconde lo que de todas formas rechazaria.
 */
export interface Permisos {
  /** Expediente, consultas, medidas, planes y catalogos de menus. */
  verClinico: boolean;
  /** Se le pueden asignar citas y abrir consultas. */
  atiende: boolean;
  /** Alta, baja, roles y contraseñas del equipo. */
  gestionarEquipo: boolean;
  /** Datos fiscales de la clinica. */
  configurarClinica: boolean;
}

export function permisosDe(rol: RolUsuario | undefined): Permisos {
  const clinico = rol === "Administrador" || rol === "Nutricionista";
  return {
    verClinico: clinico,
    atiende: clinico,
    gestionarEquipo: rol === "Administrador",
    configurarClinica: rol === "Administrador",
  };
}

export const ETIQUETA_ROL: Record<RolUsuario, string> = {
  Administrador: "Administrador",
  Nutricionista: "Nutricionista",
  Recepcion: "Recepción",
};

export const DESCRIPCION_ROL: Record<RolUsuario, string> = {
  Administrador: "Atiende pacientes y gestiona el equipo y la clínica.",
  Nutricionista: "Atiende pacientes: consultas, expedientes y planes.",
  Recepcion: "Agenda citas y cobra. No ve notas ni expedientes clínicos.",
};

/** Puede recibir citas: los selectores de agenda solo muestran a estos. */
export function atiendePacientes(persona: { rol: RolUsuario; isActive: boolean }) {
  return persona.isActive && persona.rol !== "Recepcion";
}

/** Reglas de contraseña del backend (NutricionistaService.ValidarContrasena). */
export function problemaContrasena(contrasena: string): string | null {
  if (contrasena.length < 8) return "Usa al menos 8 caracteres.";
  if (!/[A-ZÁÉÍÓÚÑ]/.test(contrasena)) return "Incluye al menos una mayúscula.";
  if (!/\d/.test(contrasena)) return "Incluye al menos un número.";
  return null;
}

/** Contraseña temporal legible para dictarla o copiarla: Palabra + 4 digitos. */
export function generarContrasenaTemporal(): string {
  const palabras = ["Manzana", "Avena", "Nopal", "Mango", "Lenteja", "Pepino", "Quinoa", "Jicama", "Guayaba", "Almendra"];
  const azar = new Uint32Array(2);
  crypto.getRandomValues(azar);
  const [a = 0, b = 0] = azar;
  const palabra = palabras[a % palabras.length] ?? "Avena";
  const numero = String(b % 10_000).padStart(4, "0");
  return `${palabra}${numero}`;
}
