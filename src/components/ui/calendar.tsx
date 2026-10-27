import type { ChangeEvent } from "react";
import { DayPicker, type DropdownProps } from "react-day-picker";
import { es } from "react-day-picker/locale/es";
import "react-day-picker/style.css";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Mes y anio del titulo con el Select de la app en vez del <select> nativo
 * que pinta react-day-picker. DayPicker espera un evento de cambio de
 * <select>, asi que se le entrega uno minimo con el valor elegido.
 */
function DesplegableCalendario({
  options,
  value,
  onChange,
  disabled,
  "aria-label": etiqueta,
}: DropdownProps) {
  return (
    <Select
      value={value !== undefined ? String(value) : undefined}
      disabled={disabled}
      onValueChange={(siguiente) =>
        onChange?.({ target: { value: siguiente } } as ChangeEvent<HTMLSelectElement>)
      }
    >
      <SelectTrigger
        size="sm"
        aria-label={etiqueta}
        className="bg-card h-8 gap-1 px-2.5 font-medium capitalize"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-64">
        {options?.map((opcion) => (
          <SelectItem
            key={opcion.value}
            value={String(opcion.value)}
            disabled={opcion.disabled}
            className="capitalize tabular-nums"
          >
            {opcion.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface CalendarProps {
  className?: string;
  selected?: Date | undefined;
  onSelect?: (fecha: Date | undefined) => void;
  /** Bloquea fechas posteriores (cumpleaños, por ejemplo). */
  hasta?: Date;
  /** Bloquea fechas anteriores (una cita nueva no va en el pasado). */
  desde?: Date;
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
  desde,
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
        components={{ Dropdown: DesplegableCalendario }}
        startMonth={startMonth}
        endMonth={endMonth}
        disabled={
          hasta || desde
            ? (fecha) =>
                (hasta !== undefined && fecha.getTime() > hasta.getTime()) ||
                (desde !== undefined && fecha.getTime() < desde.getTime())
            : undefined
        }
      />
    </div>
  );
}
