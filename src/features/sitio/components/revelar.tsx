import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* Esquina o lado desde el que entra: cada valor mueve el punto de partida en CSS. */
export type OrigenRevelar = "abajo" | "izquierda" | "derecha" | "esquina-izquierda" | "esquina-derecha";

/**
 * Aparece una sola vez cuando entra en pantalla, desde `desde`. `retraso`
 * escalona a los que entran a la vez. La animacion es de CSS (transform y
 * opacity); sin soporte de observador, se muestra de inmediato.
 */
export function Revelar({
  children,
  desde = "abajo",
  retraso = 0,
  className,
}: {
  children: ReactNode;
  desde?: OrigenRevelar;
  retraso?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const elemento = ref.current;
    if (visible || !elemento) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        setVisible(true);
        observador.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      data-visible={visible}
      data-desde={desde}
      style={{ "--retraso": `${retraso}ms` } as React.CSSProperties}
      className={cn("revelar", className)}
    >
      {children}
    </div>
  );
}
