import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { resolverPeriodo, type Periodo, type TipoPeriodo } from "@/lib/periodo";
import { hoyEnClinica } from "@/lib/zona-horaria";

const TIPOS: TipoPeriodo[] = ["dia", "semana", "mes", "anio", "rango"];
const CLAVE = /^\d{4}-\d{2}-\d{2}$/;

const claveValida = (valor: string | null) => (valor && CLAVE.test(valor) ? valor : undefined);

/**
 * Periodo guardado en la URL (?periodo=mes&ancla=2026-10-01), para que un
 * filtro sobreviva al refresh y se pueda compartir. Sin parametros, el periodo
 * actual del tipo `predeterminado`.
 */
export function usePeriodoUrl(predeterminado: TipoPeriodo = "dia") {
  const [parametros, setParametros] = useSearchParams();
  const crudo = parametros.get("periodo") as TipoPeriodo | null;
  const tipo = crudo && TIPOS.includes(crudo) ? crudo : predeterminado;
  const ancla = claveValida(parametros.get("ancla")) ?? hoyEnClinica();
  const desde = claveValida(parametros.get("desde"));
  const hasta = claveValida(parametros.get("hasta"));

  const periodo = useMemo<Periodo>(() => ({ tipo, ancla, desde, hasta }), [tipo, ancla, desde, hasta]);
  const rango = useMemo(() => resolverPeriodo(periodo), [periodo]);

  const cambiar = useCallback(
    (siguiente: Periodo) => {
      setParametros(
        (actuales) => {
          for (const clave of ["periodo", "ancla", "desde", "hasta"]) actuales.delete(clave);
          if (siguiente.tipo === "rango") {
            actuales.set("periodo", "rango");
            if (siguiente.desde) actuales.set("desde", siguiente.desde);
            if (siguiente.hasta) actuales.set("hasta", siguiente.hasta);
            return actuales;
          }
          if (siguiente.tipo !== predeterminado) actuales.set("periodo", siguiente.tipo);
          if (siguiente.ancla !== hoyEnClinica()) actuales.set("ancla", siguiente.ancla);
          return actuales;
        },
        { replace: true },
      );
    },
    [predeterminado, setParametros],
  );

  return { periodo, rango, cambiar };
}
