import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatearNumero } from "@/features/menus/lib/menus";
import {
  cambiarAMedida,
  cambiarCantidad,
  opcionesDeMedida,
  racionEnGramos,
  type OpcionMedida,
  type Racion,
} from "@/features/menus/lib/medidas";
import { cn } from "@/lib/utils";

const GRAMOS = "__gramos__";

const SIN_FLECHAS =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/**
 * Cantidad + unidad de un ingrediente. "g" siempre esta y es lo normal; las
 * medidas caseras del alimento son una opcion mas. Todas las filas tienen las
 * mismas dos cajas, con o sin medidas, para que queden alineadas en columna.
 */
export function CampoRacion({
  racion,
  medidas,
  onChange,
  etiqueta,
  className,
  alto = "h-10",
}: {
  racion: Racion;
  medidas: OpcionMedida[] | undefined;
  onChange: (racion: Racion) => void;
  /** Nombre del alimento, para lectores de pantalla. */
  etiqueta: string;
  className?: string;
  alto?: "h-9" | "h-10";
}) {
  const opciones = opcionesDeMedida(medidas, racion);
  const enMedida = racion.medida !== null;
  const aNumero = (texto: string) => (texto === "" ? undefined : Number(texto));

  const cambiarUnidad = (valor: string) => {
    if (valor === GRAMOS) return onChange(racionEnGramos(racion.gramos));
    const opcion = opciones.find((o) => o.nombre === valor);
    if (opcion) onChange(cambiarAMedida(racion, opcion));
  };

  return (
    <div className={cn("min-w-0", className)}>
      <div className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-1.5">
        <Input
          type="number"
          inputMode="decimal"
          min={enMedida ? 0 : 1}
          step={enMedida ? "0.25" : "1"}
          aria-label={enMedida ? `Cantidad de ${etiqueta}` : `Gramos de ${etiqueta}`}
          value={(enMedida ? racion.cantidad : racion.gramos) ?? ""}
          onChange={(e) => {
            const valor = aNumero(e.target.value);
            onChange(enMedida ? cambiarCantidad(racion, valor) : racionEnGramos(valor));
          }}
          className={cn("bg-card px-2 text-center tabular-nums", alto, SIN_FLECHAS)}
        />
        {opciones.length === 0 ? (
          <div
            aria-hidden
            className={cn("border-input bg-muted/40 text-muted-foreground flex items-center rounded-lg border px-2.5 text-sm", alto)}
          >
            g
          </div>
        ) : (
          <Select value={racion.medida ?? GRAMOS} onValueChange={cambiarUnidad}>
            {/* El tamano del trigger gana a una clase h-* suelta; aqui se iguala al input. */}
            <SelectTrigger
              size={alto === "h-9" ? "sm" : "default"}
              className="bg-card w-full px-2.5 data-[size=default]:h-10"
              aria-label={`Unidad de ${etiqueta}`}
            >
              {/* Cerrado solo va el nombre: el peso se ve en la lista y junto a las kcal. */}
              <SelectValue className="min-w-0">
                <span className="truncate">{racion.medida ?? "g"}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GRAMOS}>g</SelectItem>
              {opciones.map((o) => (
                <SelectItem key={o.nombre} value={o.nombre}>
                  {o.nombre} · {formatearNumero(o.gramos)} g
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {enMedida && (
        <p className="text-muted-foreground mt-1 pl-1 text-[11px] tabular-nums sm:hidden">
          {racion.gramos ? `= ${formatearNumero(racion.gramos)} g` : "Indica la cantidad"}
        </p>
      )}
    </div>
  );
}

/**
 * Calorias de la fila y, si va en medida casera, sus gramos debajo. Cabe en la
 * altura del input para que todas las filas midan lo mismo.
 */
export function ResumenRacion({
  kcal,
  racion,
  className,
}: {
  kcal: string;
  racion: Racion;
  className?: string;
}) {
  return (
    <div className={cn("flex-col justify-center text-right leading-tight tabular-nums whitespace-nowrap", className)}>
      <span className="text-muted-foreground text-sm">{kcal}</span>
      {racion.medida && racion.gramos ? (
        <span className="text-muted-foreground text-[11px]">{formatearNumero(racion.gramos)} g</span>
      ) : null}
    </div>
  );
}
