import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases condicionales y resuelve conflictos de Tailwind.
 * tailwind-merge gana: la ultima clase util sobrescribe a la anterior,
 * que es justo lo que se necesita al sobreescribir un componente shadcn.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
