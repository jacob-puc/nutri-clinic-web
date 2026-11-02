import { ShieldCheck, Stethoscope, Headset, type LucideIcon } from "lucide-react";
import { z } from "zod";

import type { ActualizarNutricionistaDto, Nutricionista, RolUsuario } from "@/types/api";

/** Mismas reglas que ActualizarNutricionistaValidator del backend. */
export const esquemaDatosPersona = z.object({
  nombreCompleto: z.string().trim().min(1, "Escribe el nombre.").max(100, "Máximo 100 caracteres."),
  correoElectronico: z
    .string()
    .trim()
    .min(1, "Escribe el correo.")
    .email("El correo no es válido.")
    .max(200, "Máximo 200 caracteres."),
  telefono: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+?[0-9]{7,15}$/.test(v.replace(/[\s-]/g, "")), "De 7 a 15 dígitos, sin letras."),
  especialidad: z.string().trim().max(100, "Máximo 100 caracteres."),
  numeroColegiatura: z.string().trim().max(50, "Máximo 50 caracteres."),
});

export type ValoresDatosPersona = z.infer<typeof esquemaDatosPersona>;

export function valoresDe(persona?: Nutricionista | null): ValoresDatosPersona {
  return {
    nombreCompleto: persona?.nombreCompleto ?? "",
    correoElectronico: persona?.correoElectronico ?? "",
    telefono: persona?.telefono ?? "",
    especialidad: persona?.especialidad ?? "",
    numeroColegiatura: persona?.numeroColegiatura ?? "",
  };
}

export function dtoDe(valores: ValoresDatosPersona): ActualizarNutricionistaDto {
  const vacio = (v: string) => (v.trim() === "" ? null : v.trim());
  return {
    nombreCompleto: valores.nombreCompleto.trim(),
    correoElectronico: valores.correoElectronico.trim().toLowerCase(),
    telefono: vacio(valores.telefono.replace(/[\s-]/g, "")),
    especialidad: vacio(valores.especialidad),
    numeroColegiatura: vacio(valores.numeroColegiatura),
  };
}

export const ROLES: RolUsuario[] = ["Nutricionista", "Administrador", "Recepcion"];

export const ICONO_ROL: Record<RolUsuario, LucideIcon> = {
  Administrador: ShieldCheck,
  Nutricionista: Stethoscope,
  Recepcion: Headset,
};

export const TONO_ROL: Record<RolUsuario, string> = {
  Administrador: "bg-accent-soft text-accent-soft-foreground ring-accent-soft-foreground/15",
  Nutricionista: "bg-primary-soft text-primary-soft-foreground ring-primary/15",
  Recepcion: "bg-info-soft text-info-soft-foreground ring-info-soft-foreground/15",
};

/** Lo que se ve bajo el nombre: la especialidad, o el rol si no la tiene. */
export function subtituloDe(persona: Nutricionista): string {
  if (persona.rol === "Recepcion") return "Recepción";
  return persona.especialidad ?? "Nutrición";
}
