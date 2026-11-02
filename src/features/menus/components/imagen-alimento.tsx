import { useState } from "react";
import { Apple } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Miniatura de un alimento. Sin foto (o si la URL falla) muestra la teja con
 * el icono, asi la lista conserva su ritmo aunque falten imagenes.
 */
export function ImagenAlimento({
  url,
  nombre,
  className,
}: {
  url: string | null | undefined;
  nombre: string;
  className?: string;
}) {
  const [fallo, setFallo] = useState(false);
  const base = cn("shrink-0 overflow-hidden rounded-lg", className ?? "size-10");

  if (!url || fallo) {
    return (
      <span aria-hidden className={cn(base, "bg-primary-soft text-primary-soft-foreground grid place-items-center")}>
        <Apple className="size-1/2" />
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={nombre}
      loading="lazy"
      onError={() => setFallo(true)}
      className={cn(base, "bg-muted object-cover")}
    />
  );
}
