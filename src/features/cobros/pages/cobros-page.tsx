import { useSearchParams } from "react-router-dom";
import { Building2, FileText, Receipt, Wallet, type LucideIcon } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabDatosClinica } from "@/features/cobros/components/tab-datos-clinica";
import { TabFacturas } from "@/features/cobros/components/tab-facturas";
import { TabPagos } from "@/features/cobros/components/tab-pagos";
import { TabPorCobrar } from "@/features/cobros/components/tab-por-cobrar";

type Vista = "pendientes" | "cobros" | "facturas" | "clinica";

/* Ordenadas por frecuencia: lo pendiente primero, la configuracion al final. */
const VISTAS: { valor: Vista; etiqueta: string; icono: LucideIcon }[] = [
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
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="pb-2">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">Cobros</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Las consultas se cobran al cerrarlas; aquí queda lo pendiente, el corte del día y las facturas.
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

        <TabsContent value="pendientes" className="mt-5">
          <TabPorCobrar />
        </TabsContent>
        <TabsContent value="cobros" className="mt-5">
          <TabPagos />
        </TabsContent>
        <TabsContent value="facturas" className="mt-5">
          <TabFacturas />
        </TabsContent>
        <TabsContent value="clinica" className="mt-5">
          <TabDatosClinica />
        </TabsContent>
      </Tabs>
    </div>
  );
}
