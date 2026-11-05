import { useSearchParams } from "react-router-dom";
import { Clock, Landmark } from "lucide-react";

import { Subnav, type OpcionSubnav } from "@/components/ui/subnav";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SeccionDatosFiscales } from "@/features/configuracion/components/seccion-datos-fiscales";
import { SeccionHorarioClinica } from "@/features/configuracion/components/seccion-horario-clinica";

type Vista = "fiscales" | "horario";

const VISTAS: (OpcionSubnav & { valor: Vista })[] = [
  { valor: "fiscales", etiqueta: "Datos fiscales", icono: Landmark },
  { valor: "horario", etiqueta: "Horario de la clínica", icono: Clock },
];

/** Ajustes generales de la clinica, solo para el administrador. */
export function ConfiguracionPage() {
  const [parametros, setParametros] = useSearchParams();
  const vista: Vista = parametros.get("vista") === "horario" ? "horario" : "fiscales";

  const cambiarVista = (siguiente: string) =>
    setParametros(
      (actuales) => {
        if (siguiente === "fiscales") actuales.delete("vista");
        else actuales.set("vista", siguiente);
        return actuales;
      },
      { replace: true },
    );

  return (
    <Tabs value={vista} onValueChange={cambiarVista} className="gap-0">
      <Subnav
        titulo="Configuración"
        ayuda="Los datos fiscales salen en recibos y facturas. El horario es el general de quienes no tienen uno propio."
        opciones={VISTAS}
      />

      <div className="mx-auto w-full max-w-7xl px-4 pt-3 pb-8 md:px-8 md:pb-10">
        <TabsContent value="fiscales" className="anim-vista">
          <SeccionDatosFiscales />
        </TabsContent>
        <TabsContent value="horario" className="anim-vista">
          <SeccionHorarioClinica />
        </TabsContent>
      </div>
    </Tabs>
  );
}
