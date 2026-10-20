import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale/es";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";

interface CalendarProps {
  className?: string;
  selected?: Date | undefined;
  onSelect?: (fecha: Date | undefined) => void;
  /** Bloquea fechas posteriores (cumpleaños, por ejemplo). */
  hasta?: Date;
  /** Primer y ultimo mes navegables; tambien limita los anos del desplegable. */
  startMonth?: Date;
  endMonth?: Date;
  /** Titulos con menus desplegables de mes y anio. */
  conDesplegables?: boolean;
}

/** Selector de fecha unica con la paleta del proyecto; nada nativo. */
export function Calendar({
  className,
  selected,
  onSelect,
  hasta,
  startMonth,
  endMonth,
  conDesplegables = false,
}: CalendarProps) {
  return (
    <div
      className={cn(
        "bg-background w-fit rounded-lg border border-border p-2 shadow-none",
        className,
      )}
    >
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        locale={es}
        showOutsideDays
        defaultMonth={selected}
        captionLayout={conDesplegables ? "dropdown" : "label"}
        startMonth={startMonth}
        endMonth={endMonth}
        disabled={hasta ? (fecha) => fecha.getTime() > hasta.getTime() : undefined}
      />
    </div>
  );
}
