import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Ruler } from "lucide-react";

import { DialogoMedidaConsulta } from "@/features/consultas/components/dialogo-medida-consulta";
import { EncabezadoBloque } from "@/features/consultas/components/encabezado-bloque";
import {
  formatearMetrica,
  METRICAS_VISIBLES,
  valorDe,
  type ClaveCapturable,
  type Metrica,
} from "@/features/consultas/lib/metricas";
import { formatearFechaCorta } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Guid, MedidaAntropometrica } from "@/types/api";

/**
 * Medidas tomadas en esta consulta: una tarjeta por dato capturado. Si solo
 * se peso al paciente, aparece solo el peso (y el IMC, que sale de el); al
 * registrar cintura o grasa se suman sus tarjetas.
 *
 * El cambio frente a la medicion anterior solo indica direccion, sin verde o
 * rojo: bajar de peso no siempre es el objetivo.
 */
export function SeccionMedidasConsulta({
  pacienteId,
  consultaId,
  medida,
  anterior,
  soloLectura,
}: {
  pacienteId: Guid;
  consultaId: Guid;
  /** El registro de esta consulta (el mas reciente si hubiera varios). */
  medida?: MedidaAntropometrica;
  anterior?: MedidaAntropometrica;
  soloLectura: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [enfocar, setEnfocar] = useState<ClaveCapturable | undefined>();

  const abrir = (clave?: ClaveCapturable) => {
    setEnfocar(clave);
    setAbierto(true);
  };

  const capturadas = medida ? METRICAS_VISIBLES.filter((m) => valorDe(medida, m.clave) !== null) : [];

  if (soloLectura && !medida) return null;

  return (
    <section aria-labelledby="titulo-medidas">
      <EncabezadoBloque id="titulo-medidas" icono={Ruler} titulo="Medidas de la consulta" />

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {medida &&
          capturadas.map((metrica) => (
            <TarjetaMetrica
              key={metrica.clave}
              metrica={metrica}
              valor={valorDe(medida, metrica.clave)!}
              previo={valorDe(anterior, metrica.clave)}
              detalle={metrica.clave === "imc" ? `Con ${formatearMetrica(medida.estatura)} cm` : undefined}
              onEditar={
                soloLectura
                  ? undefined
                  : () => abrir(metrica.clave === "imc" ? "estatura" : (metrica.clave as ClaveCapturable))
              }
            />
          ))}

        {!soloLectura && (
          <button
            type="button"
            onClick={() => abrir()}
            className={cn(
              "border-muted-foreground/40 hover:border-primary/60 hover:bg-primary-soft/25 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25",
              !medida && "col-span-full",
            )}
          >
            <span className="bg-primary-soft text-primary-soft-foreground grid size-10 shrink-0 place-items-center rounded-lg">
              <Plus className="size-5" aria-hidden />
            </span>
            <span>
              <span className="text-foreground block text-sm font-medium">
                {medida ? "Agregar medida" : "Registrar medidas"}
              </span>
              <span className="text-muted-foreground block text-xs">
                {medida ? "Cintura, grasa, cadera…" : "Puedes anotar solo el peso y sumar lo demás después"}
              </span>
            </span>
          </button>
        )}
      </div>

      {medida?.notasObservaciones && (
        <p className="text-muted-foreground mt-2 text-sm italic">{medida.notasObservaciones}</p>
      )}

      <DialogoMedidaConsulta
        abierto={abierto}
        onOpenChange={setAbierto}
        pacienteId={pacienteId}
        consultaId={consultaId}
        medida={medida}
        anterior={anterior}
        enfocar={enfocar}
      />
    </section>
  );
}

function TarjetaMetrica({
  metrica,
  valor,
  previo,
  detalle,
  onEditar,
}: {
  metrica: Metrica;
  valor: number;
  previo: number | null;
  detalle?: string;
  onEditar?: () => void;
}) {
  const cambio = previo !== null ? valor - previo : null;
  const contenido = (
    <>
      <span className="text-muted-foreground block text-xs">{metrica.etiqueta}</span>
      <span className="mt-1 flex items-baseline gap-1">
        <span className="text-foreground text-2xl font-semibold tracking-tight tabular-nums">
          {formatearMetrica(valor)}
        </span>
        {metrica.unidad && <span className="text-muted-foreground text-sm">{metrica.unidad}</span>}
      </span>
      <span className="text-muted-foreground mt-1 flex items-center gap-1 text-xs tabular-nums">
        {cambio !== null && Math.abs(cambio) >= 0.05 ? (
          <>
            {cambio < 0 ? <ArrowDown className="size-3" aria-hidden /> : <ArrowUp className="size-3" aria-hidden />}
            <span className="sr-only">{cambio < 0 ? "Bajó" : "Subió"}</span>
            {formatearMetrica(Math.abs(cambio))} {metrica.unidad}
          </>
        ) : cambio !== null ? (
          "Sin cambio"
        ) : (
          (detalle ?? "Primera vez")
        )}
      </span>
    </>
  );

  const clases = "hoja rounded-xl px-4 py-3 text-left";

  if (!onEditar) return <div className={clases}>{contenido}</div>;

  return (
    <button
      type="button"
      onClick={onEditar}
      aria-label={`Editar ${metrica.etiqueta}`}
      className={cn(
        clases,
        "cursor-pointer transition-colors outline-none hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-primary/25",
      )}
    >
      {contenido}
    </button>
  );
}

const instante = (medida: MedidaAntropometrica) => Date.parse(medida.fechaMedicion) || 0;

/**
 * Como llego el paciente: lo mas reciente de cada medida ANTES de esta
 * consulta, en una linea, para la hoja de arriba. Es fijo a proposito: lo
 * que se registra hoy aparece abajo, en las tarjetas, y se compara contra
 * esto; si cambiara al registrar se perderia la referencia.
 *
 * Se toma por dato y no por registro: si la cintura se midio hace dos meses
 * y la visita pasada solo el peso, se ven las dos, cada una con su valor.
 */
export function UltimasMedidas({
  medidas,
  consultaId,
  inicioConsulta,
}: {
  medidas: MedidaAntropometrica[];
  consultaId: Guid;
  inicioConsulta: string;
}) {
  const limite = Date.parse(inicioConsulta);
  const previas = medidas
    .filter((m) => m.consultaId !== consultaId && instante(m) <= limite)
    .sort((a, b) => instante(b) - instante(a));

  const datos = METRICAS_VISIBLES.flatMap((m) => {
    const fuente = previas.find((medida) => valorDe(medida, m.clave) !== null);
    return fuente ? [{ ...m, valor: valorDe(fuente, m.clave)! }] : [];
  });
  const ultima = previas[0];

  if (!ultima) {
    return <p className="text-muted-foreground text-sm">Sin mediciones previas: es su primera vez.</p>;
  }

  return (
    <p className="text-sm leading-relaxed">
      {datos.map((m, i) => (
        <span key={m.clave} className="whitespace-nowrap">
          {i > 0 && <span className="text-muted-foreground-subtle mx-1.5">·</span>}
          <span className="text-muted-foreground">{m.etiqueta}</span>{" "}
          <span className="text-foreground font-semibold tabular-nums">
            {formatearMetrica(m.valor)}
            {m.unidad && ` ${m.unidad}`}
          </span>
        </span>
      ))}
      <span className="text-muted-foreground-subtle ml-2 text-xs whitespace-nowrap">
        al {formatearFechaCorta(ultima.fechaMedicion)}
      </span>
    </p>
  );
}
