import { useEffect, useState } from "react";

const CLAVE = "nc_bienvenida";
const DURACION_MS = 1300;

/** La marca el login: asi el saludo sale una vez y no al recargar. */
export function marcarBienvenida() {
  try {
    sessionStorage.setItem(CLAVE, "1");
  } catch {
    /* Sin almacenamiento simplemente no hay saludo. */
  }
}

function hayBienvenida() {
  try {
    return (
      sessionStorage.getItem(CLAVE) === "1" &&
      window.matchMedia("(prefers-reduced-motion: no-preference)").matches
    );
  } catch {
    return false;
  }
}

/** true durante la entrada: el layout la usa para animar el menu y el contenido. */
export function useBienvenida() {
  const [activa, setActiva] = useState(hayBienvenida);

  useEffect(() => {
    if (!activa) return;
    sessionStorage.removeItem(CLAVE);
    const temporizador = setTimeout(() => setActiva(false), DURACION_MS);
    return () => clearTimeout(temporizador);
  }, [activa]);

  return activa;
}

/**
 * Puente entre el login y el sistema: el mismo fondo del login con un saludo,
 * que se desvanece mientras el sistema aparece debajo.
 */
export function BienvenidaSistema({ nombre }: { nombre: string | null }) {
  return (
    <div aria-hidden className="bienvenida-sistema fondo-sitio text-foreground fixed inset-0 z-50 isolate grid place-items-center">
      <p className="font-editorial anim-vista text-5xl tracking-tight sm:text-7xl">
        Hola{nombre && <>, <em className="text-primary font-normal">{nombre}</em></>}
      </p>
    </div>
  );
}
