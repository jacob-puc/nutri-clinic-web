import { useSearchParams } from "react-router-dom";
import { Building2, FileText, Receipt, Wallet } from "lucide-react";

import { Subnav, type OpcionSubnav } from "@/components/ui/subnav";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TabDatosClinica } from "@/features/cobros/components/tab-datos-clinica";
import { TabFacturas } from "@/features/cobros/components/tab-facturas";
import { TabPagos } from "@/features/cobros/components/tab-pagos";
import { TabPorCobrar } from "@/features/cobros/components/tab-por-cobrar";

type Vista = "pendientes" | "cobros" | "facturas" | "clinica";

/* Ordenadas por frecuencia: lo pendiente primero, la configuracion al final. */
const VISTAS: (OpcionSubnav & { valor: Vista })[] = [
  { valor: "pendientes", etiqueta: "Por cobrar", icono: Wallet },
  { valor: "cobros", etiqueta: "Cobros y corte", icono: Receipt },
  { valor: "facturas", etiqueta: "Facturas", icono: FileText },
  { valor: "clinica", etiqueta: "Datos fiscales", icono: Building2 },
];

function esVista(valor: string | null): valor is Vista {
  return VISTAS.some((v) => v.valor === valor);
}

/**
 * Lo que no se resolvio al cerrar la consulta: cobros pendientes, el corte
 * del dia, las facturas que se piden despues y los datos fiscales de la
 * clinica. El cobro del dia a dia se hace al cerrar la consulta.
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
        <TabsContent value="pendientes">
          <TabPorCobrar />
        </TabsContent>
        <TabsContent value="cobros">
          <TabPagos />
        </TabsContent>
        <TabsContent value="facturas">
          <TabFacturas />
        </TabsContent>
        <TabsContent value="clinica">
          <TabDatosClinica />
        </TabsContent>
      </div>
    </Tabs>
  );
}
