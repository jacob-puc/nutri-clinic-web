import { useMemo } from "react";

import type { InsigniasNav } from "@/components/layout/nav-items";
import { usePorCobrar } from "@/features/cobros/hooks/use-cobros";
import { useCitas } from "@/features/citas/hooks/use-citas";
import { estaPorAtender } from "@/features/citas/lib/estados-cita";
import { useConsultasAbiertas } from "@/features/consultas/hooks/use-consultas";
import { hoyEnClinica, rangoDelDia } from "@/lib/zona-horaria";

/**
 * Contadores del menu lateral: lo que pide atencion sin tener que entrar a
 * cada modulo. Reutiliza las mismas consultas que esas pantallas, asi que
 * React Query las comparte y no suma peticiones al navegar.
 */
export function useInsigniasNav(): InsigniasNav {
  const rango = useMemo(() => rangoDelDia(hoyEnClinica()), []);
  const citas = useCitas(rango);
  const abiertas = useConsultasAbiertas();
  const { pendientes } = usePorCobrar();

  const citasPendientes = (citas.data ?? []).filter(estaPorAtender).length;
  const enCurso = abiertas.data?.length ?? 0;

  const insignias: InsigniasNav = {};
  if (citasPendientes > 0) {
    insignias["/citas"] = {
      valor: citasPendientes,
      tono: "marca",
      descripcion: `${citasPendientes} ${citasPendientes === 1 ? "cita pendiente" : "citas pendientes"} hoy`,
    };
  }
  if (enCurso > 0) {
    insignias["/consultas"] = {
      valor: enCurso,
      tono: "marca",
      pulso: true,
      descripcion: `${enCurso} ${enCurso === 1 ? "consulta en curso" : "consultas en curso"}`,
    };
  }
  if (pendientes.length > 0) {
    insignias["/cobros"] = {
      valor: pendientes.length,
      tono: "aviso",
      descripcion: `${pendientes.length} ${pendientes.length === 1 ? "consulta por cobrar" : "consultas por cobrar"}`,
    };
  }
  return insignias;
}
