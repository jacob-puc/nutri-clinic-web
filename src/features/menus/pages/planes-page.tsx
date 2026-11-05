import { useSearchParams } from "react-router-dom";
import { Apple, CalendarRange, ClipboardCheck, UtensilsCrossed } from "lucide-react";

import { Subnav, type OpcionSubnav } from "@/components/ui/subnav";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TabAlimentos } from "@/features/menus/components/tab-alimentos";
import { TabPlanes } from "@/features/menus/components/tab-planes";
import { TabPlantillas } from "@/features/menus/components/tab-plantillas";
import { TabPlatos } from "@/features/menus/components/tab-platos";

type Vista = "planes" | "plantillas" | "platos" | "alimentos";

/* Ordenadas de lo que se usa a diario a lo que se configura una vez: el
   plan del paciente sale de una plantilla, la plantilla de platos y los
   platos de alimentos. */
const VISTAS: (OpcionSubnav & { valor: Vista })[] = [
  { valor: "planes", etiqueta: "Planes de pacientes", icono: ClipboardCheck },
  { valor: "plantillas", etiqueta: "Plantillas", icono: CalendarRange },
  { valor: "platos", etiqueta: "Platos", icono: UtensilsCrossed },
  { valor: "alimentos", etiqueta: "Alimentos", icono: Apple },
];

function esVista(valor: string | null): valor is Vista {
  return VISTAS.some((v) => v.valor === valor);
}

export function PlanesPage() {
  const [parametros, setParametros] = useSearchParams();
  const crudo = parametros.get("vista");
  const vista: Vista = esVista(crudo) ? crudo : "planes";

  /* La pestaña vive en la URL: un refresco o un enlace compartido abren la
     misma vista. replace evita llenar el historial al cambiar de pestaña. */
  const cambiarVista = (siguiente: string) =>
    setParametros(
      (actuales) => {
        if (siguiente === "planes") actuales.delete("vista");
        else actuales.set("vista", siguiente);
        return actuales;
      },
      { replace: true },
    );

  return (
    <Tabs value={vista} onValueChange={cambiarVista} className="gap-0">
      <Subnav
        titulo="Planes nutricionales"
        ayuda="Los alimentos forman platos, los platos arman plantillas semanales y cada plantilla se ajusta como el plan de un paciente."
        opciones={VISTAS}
      />

      <div className="mx-auto w-full max-w-7xl px-4 pt-3 pb-8 md:px-8 md:pb-10">
        {/* Cada pestaña pide sus datos al montarse; Radix desmonta las
            inactivas, asi que solo se consulta lo que se esta viendo. */}
        <TabsContent value="planes">
          <TabPlanes />
        </TabsContent>
        <TabsContent value="plantillas">
          <TabPlantillas />
        </TabsContent>
        <TabsContent value="platos">
          <TabPlatos />
        </TabsContent>
        <TabsContent value="alimentos">
          <TabAlimentos />
        </TabsContent>
      </div>
    </Tabs>
  );
}
