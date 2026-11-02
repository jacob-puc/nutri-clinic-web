import { useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

/** `accept` del input ("image/*", ".pdf,.png") aplicado tambien al soltar. */
function aceptaArchivo(archivo: File, accept: string): boolean {
  return accept.split(",").some((patron) => {
    const p = patron.trim().toLowerCase();
    if (p.endsWith("/*")) return archivo.type.startsWith(p.slice(0, -1));
    if (p.startsWith(".")) return archivo.name.toLowerCase().endsWith(p);
    return archivo.type === p;
  });
}

/**
 * Zona para soltar un archivo o elegirlo con clic. Debajo hay un input real
 * de tipo archivo, asi que en el telefono sigue abriendo la camara y con
 * teclado se activa como cualquier boton.
 */
export function ZonaArchivos({
  accept,
  onArchivo,
  icono: Icono,
  titulo,
  detalle,
  compacta = false,
  className,
  children,
}: {
  accept: string;
  onArchivo: (archivo: File) => void;
  icono: LucideIcon;
  titulo: string;
  detalle?: string;
  /** Una sola linea: para lo opcional, que no debe pesar visualmente. */
  compacta?: boolean;
  className?: string;
  /** Contenido extra dentro de la zona (p. ej. miniaturas). */
  children?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  /* Contador y no booleano: dragenter/dragleave tambien se disparan al pasar
     por los hijos, y un booleano parpadea. */
  const [arrastres, setArrastres] = useState(0);
  const arrastrando = arrastres > 0;

  const recibir = (archivos: FileList | null) => {
    const archivo = archivos?.[0];
    if (!archivo) return;
    if (!aceptaArchivo(archivo, accept)) {
      toast.error("Tipo de archivo no admitido", { description: archivo.name });
      return;
    }
    if (archivos.length > 1) {
      toast.info("Se tomó solo el primer archivo", { description: "Súbelos de uno en uno." });
    }
    onArchivo(archivo);
  };

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setArrastres((n) => n + 1);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setArrastres((n) => Math.max(0, n - 1))}
      onDrop={(e) => {
        e.preventDefault();
        setArrastres(0);
        recibir(e.dataTransfer.files);
      }}
      className={cn(
        "rounded-xl border border-dashed transition-colors",
        arrastrando
          ? "border-primary bg-primary-soft/60"
          : "border-muted-foreground/40 hover:border-primary/60 hover:bg-primary-soft/25",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          recibir(e.target.files);
          /* Permite volver a elegir el mismo archivo tras cancelar. */
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex w-full cursor-pointer items-center rounded-xl text-left outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25",
          compacta ? "gap-2.5 px-3.5 py-2.5" : "flex-col justify-center gap-2 px-4 py-6 text-center",
        )}
      >
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-lg",
            compacta ? "text-muted-foreground size-7" : "bg-primary-soft text-primary-soft-foreground size-10",
            arrastrando && "text-primary",
          )}
        >
          <Icono className={compacta ? "size-4" : "size-5"} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="text-foreground block text-sm font-medium">
            {arrastrando ? "Suelta para subir" : titulo}
          </span>
          {detalle && !arrastrando && (
            <span className="text-muted-foreground block text-xs">{detalle}</span>
          )}
        </span>
      </button>
      {children}
    </div>
  );
}
