import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Exporta `cn`, que es justo lo que espera un componente shadcn generado. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
