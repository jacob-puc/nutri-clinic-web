import { useSearchParams } from "react-router-dom";
import { Apple, CalendarRange, ClipboardCheck, UtensilsCrossed, type LucideIcon } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabAlimentos } from "@/features/menus/components/tab-alimentos";
import { TabPlanes } from "@/features/menus/components/tab-planes";
import { TabPlantillas } from "@/features/menus/components/tab-plantillas";
import { TabPlatos } from "@/features/menus/components/tab-platos";

type Vista = "planes" | "plantillas" | "platos" | "alimentos";

/* Ordenadas de lo que se usa a diario a lo que se configura una vez: el
   plan del paciente sale de una plantilla, la plantilla de platos y los
   platos de alimentos. */
const VISTAS: { valor: Vista; etiqueta: string; icono: LucideIcon }[] = [
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
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="pb-2">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">Planes nutricionales</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Los alimentos forman platos, los platos arman plantillas semanales y cada plantilla se ajusta como el plan de
          un paciente.
        </p>
      </div>

      <Tabs value={vista} onValueChange={cambiarVista} className="mt-4">
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <TabsList className="w-max justify-start">
            {VISTAS.map(({ valor, etiqueta, icono: Icono }) => (
              <TabsTrigger key={valor} value={valor}>
                <Icono className="size-4" />
                {etiqueta}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Cada pestaña pide sus datos al montarse; Radix desmonta las
            inactivas, asi que solo se consulta lo que se esta viendo. */}
        <TabsContent value="planes" className="mt-5">
          <TabPlanes />
        </TabsContent>
        <TabsContent value="plantillas" className="mt-5">
          <TabPlantillas />
        </TabsContent>
        <TabsContent value="platos" className="mt-5">
          <TabPlatos />
        </TabsContent>
        <TabsContent value="alimentos" className="mt-5">
          <TabAlimentos />
        </TabsContent>
      </Tabs>
    </div>
  );
}
