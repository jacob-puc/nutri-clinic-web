import { CalendarPlus, ClipboardPlus, MoreHorizontal, Pencil, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Paciente } from "@/types/api";

/**
 * Menu de acciones por paciente.
 *
 * Decision de alcance: los items son visibles y tienen hover real, pero
 * todavia no hacen nada. En vez de dejarlos en gris (que se lee como
 * deshabilitado de forma permanente), al pulsarlos avisan con un toast de
 * "proximamente". Asi se puede revisar el diseno del menu sin que un click
 * parezca fallido.
 *
 * Ningun item navega ni llama a la API en esta iteracion.
 */

const AVISO = "Disponible en la siguiente iteracion";

interface AccionesPacienteProps {
  paciente: Paciente;
}

export function AccionesPaciente({ paciente }: AccionesPacienteProps) {
  const avisar = (accion: string) =>
    toast.info(`${accion} · ${AVISO}`, {
      description: paciente.nombreCompleto,
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground data-[state=open]:bg-accent"
          // Sin esto el boton repetido N veces no tendria nombre accesible:
          // un lector de pantalla diria "boton" N veces sin decir de quien.
          aria-label={`Acciones de ${paciente.nombreCompleto}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => avisar("Ver expediente")}>
          <UserRound />
          Ver expediente
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => avisar("Editar datos")}>
          <Pencil />
          Editar datos
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => avisar("Registrar medida")}>
          <ClipboardPlus />
          Registrar medida
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => avisar("Agendar cita")}>
          <CalendarPlus />
          Agendar cita
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* "Dar de baja" y no "Eliminar": DELETE /api/pacientes/{id} hace
            baja logica (IsActive = false). El nombre prometeria un borrado
            definitivo que el backend no hace. */}
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => avisar("Dar de baja")}
        >
          Dar de baja
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
