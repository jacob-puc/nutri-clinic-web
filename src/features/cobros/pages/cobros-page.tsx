import { useSearchParams } from "react-router-dom";
import { FileText, Receipt, Wallet } from "lucide-react";

import { Subnav, type OpcionSubnav } from "@/components/ui/subnav";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TabFacturas } from "@/features/cobros/components/tab-facturas";
import { TabPagos } from "@/features/cobros/components/tab-pagos";
import { TabPorCobrar } from "@/features/cobros/components/tab-por-cobrar";

type Vista = "pendientes" | "cobros" | "facturas";

/* Ordenadas por frecuencia: lo pendiente primero. */
const VISTAS: (OpcionSubnav & { valor: Vista })[] = [
  { valor: "pendientes", etiqueta: "Por cobrar", icono: Wallet },
  { valor: "cobros", etiqueta: "Cobros y corte", icono: Receipt },
  { valor: "facturas", etiqueta: "Facturas", icono: FileText },
];

function esVista(valor: string | null): valor is Vista {
  return VISTAS.some((v) => v.valor === valor);
}

/**
 * Lo que no se resolvio al cerrar la consulta: cobros pendientes, el corte
 * del dia y las facturas que se piden despues. El cobro del dia a dia se hace
 * al cerrar la consulta.
 */
export function CobrosPage() {
  const [parametros, setParametros] = useSearchParams();
  const crudo = parametros.get("vista");
  const vista: Vista = esVista(crudo) ? crudo : "pendientes";

  const cambiarVista = (siguiente: string) =>
    setParametros(
      (actuales) => {
        if (siguiente === "pendientes") actuales.delete("vista");
        else actuales.set("vista", siguiente);
        return actuales;
      },
      { replace: true },
    );

  return (
    <Tabs value={vista} onValueChange={cambiarVista} className="gap-0">
      <Subnav
        titulo="Cobros"
        ayuda="Las consultas se cobran al cerrarlas; aquí queda lo pendiente, los cortes y las facturas."
        opciones={VISTAS}
      />

      <div className="mx-auto w-full max-w-7xl px-4 pt-3 pb-8 md:px-8 md:pb-10">
        <TabsContent value="pendientes" className="anim-vista">
          <TabPorCobrar />
        </TabsContent>
        <TabsContent value="cobros" className="anim-vista">
          <TabPagos />
        </TabsContent>
        <TabsContent value="facturas" className="anim-vista">
          <TabFacturas />
        </TabsContent>
      </div>
    </Tabs>
  );
}
