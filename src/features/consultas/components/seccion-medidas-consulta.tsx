import { useState } from "react";
import { ClipboardPlus, Ruler } from "lucide-react";

import { DialogoMedida } from "@/features/pacientes/components/dialogo-medida";
import { Button } from "@/components/ui/button";
import { Seccion } from "@/components/ficha/seccion";
import { EstadoVacio } from "@/components/states/estado-vacio";
import { formatearHoraLocal } from "@/features/citas/lib/fechas-cita";
import type { Guid, MedidaAntropometrica } from "@/types/api";

/**
 * Medidas tomadas durante esta consulta. El formulario de alta es el mismo del
 * expediente (`DialogoMedida`), que ahora acepta `consultaId` para enlazar la
 * medición con la consulta en curso.
 */
export function SeccionMedidasConsulta({
  pacienteId,
  consultaId,
  medidas,
  estaturaSugerida,
  soloLectura,
}: {
  pacienteId: Guid;
  consultaId: Guid;
  medidas: MedidaAntropometrica[];
  estaturaSugerida?: number;
  soloLectura: boolean;
}) {
  const [registrando, setRegistrando] = useState(false);

  return (
    <>
      <Seccion
        titulo="Medidas antropométricas"
        icono={Ruler}
        meta={medidas.length > 0 ? `${medidas.length} en esta consulta` : undefined}
        acciones={
          !soloLectura ? (
            <Button size="sm" onClick={() => setRegistrando(true)}>
              <ClipboardPlus className="size-4" />
              Registrar medida
            </Button>
          ) : undefined
        }
      >
        {medidas.length === 0 ? (
          <EstadoVacio
            titulo="Sin medidas en esta consulta"
            descripcion="Toma el peso y la estatura del paciente para empezar el registro."
          >
            {!soloLectura && (
              <Button size="sm" onClick={() => setRegistrando(true)}>
                <ClipboardPlus className="size-4" />
                Registrar medida
              </Button>
            )}
          </EstadoVacio>
        ) : (
          <ul className="divide-border/60 divide-y">
            {medidas.map((medida) => (
              <li key={medida.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2.5">
                <span className="text-foreground w-24 shrink-0 text-sm font-semibold tabular-nums">
                  {medida.peso} kg
                </span>
                <span className="text-muted-foreground text-sm tabular-nums">
                  {medida.estatura} cm
                </span>
                <span className="text-foreground text-sm font-medium tabular-nums">
                  IMC {medida.imc.toFixed(1)}
                </span>
                {medida.porcentajeGrasa !== null && (
                  <span className="text-muted-foreground text-sm tabular-nums">
                    Grasa {medida.porcentajeGrasa}%
                  </span>
                )}
                {medida.medidaCintura !== null && (
                  <span className="text-muted-foreground text-sm tabular-nums">
                    Cintura {medida.medidaCintura} cm
                  </span>
                )}
                <span className="text-muted-foreground-subtle ml-auto text-xs tabular-nums">
                  {formatearHoraLocal(medida.fechaMedicion)}
                </span>
                {medida.notasObservaciones && (
                  <p className="text-muted-foreground w-full text-sm">
                    {medida.notasObservaciones}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <DialogoMedida
        abierto={registrando}
        onOpenChange={setRegistrando}
        pacienteId={pacienteId}
        consultaId={consultaId}
        estaturaSugerida={estaturaSugerida}
      />
    </>
  );
}
