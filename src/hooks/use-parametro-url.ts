import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Un filtro guardado en la URL en lugar del estado del componente: sobrevive a
 * entrar a un detalle y volver, a recargar y a compartir el enlace. El valor
 * predeterminado no se escribe, para que la URL quede limpia.
 */
export function useParametroUrl<T extends string>(clave: string, predeterminado: T): [T, (valor: T) => void] {
  const [parametros, setParametros] = useSearchParams();
  const valor = (parametros.get(clave) ?? predeterminado) as T;

  const cambiar = useCallback(
    (siguiente: T) =>
      setParametros(
        (actuales) => {
          if (siguiente === predeterminado || siguiente === "") actuales.delete(clave);
          else actuales.set(clave, siguiente);
          return actuales;
        },
        { replace: true },
      ),
    [clave, predeterminado, setParametros],
  );

  return [valor, cambiar];
}
