import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface SubirArchivoProps {
  /** Acepta la extensión/filter del input, p. ej. `image/*` o `.pdf`. */
  accept: string;
  etiqueta: string;
  subiendo: boolean;
  /** Se llama solo si hay archivo; si no lo hay, no se invoca. */
  onArchivo: (archivo: File) => void;
  className?: string;
}

/**
 * Zona de subida de archivo: un input real de tipo archivo con aspecto de
 * boton, para que el navegador (y lectores de pantalla) lo manejen como tal.
 * No hay drag & drop: en consultorio se sube la foto del dia con un clic, y
 * el selector nativo ya funciona con la camara del telefono.
 */
export function SubirArchivo({
  accept,
  etiqueta,
  subiendo,
  onArchivo,
  className,
}: SubirArchivoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enfocado, setEnfocado] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(evento) => {
          const archivo = evento.target.files?.[0];
          if (archivo) onArchivo(archivo);
          // Permite volver a elegir el mismo archivo tras un fallo.
          evento.target.value = "";
        }}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
      />
      <button
        type="button"
        disabled={subiendo}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-input bg-card text-foreground hover:border-primary/45 hover:bg-primary-soft/45 hover:text-primary-soft-foreground",
          "focus-visible:border-primary focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-primary/20",
          "flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 text-sm font-medium shadow-[inset_0_1px_2px_rgb(20_55_50/0.04),0_1px_1px_rgb(20_55_50/0.03)] transition-[color,box-shadow,border-color,background-color] duration-150 outline-none active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
          enfocado && "ring-[3px] ring-primary/20",
        )}
      >
        {subiendo ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Camera className="size-4" aria-hidden />
        )}
        {subiendo ? "Subiendo..." : etiqueta}
      </button>
    </div>
  );
}
