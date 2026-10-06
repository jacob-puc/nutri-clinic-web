import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlus,
  ClipboardPlus,
  MoreHorizontal,
  Pencil,
  UserRound,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DialogoMedida } from "@/features/pacientes/components/dialogo-medida";
import { DialogoPaciente } from "@/features/pacientes/components/dialogo-paciente";
import { pacientesApi } from "@/features/pacientes/api/pacientes-api";
import { pacientesKeys } from "@/features/pacientes/hooks/use-pacientes";
import { mensajeDeError } from "@/lib/api-error";
import type { Guid, Paciente } from "@/types/api";

interface AccionesPacienteProps {
  paciente: Paciente;
  onDarbaja?: () => void;
}

const AVISO = "Disponible en la siguiente iteracion";

export function AccionesPaciente({ paciente, onDarbaja }: AccionesPacienteProps) {
  const [editando, setEditando] = useState(false);
  const [registrandoMedida, setRegistrandoMedida] = useState(false);
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);

  const avisar = (accion: string) =>
    toast.info(`${accion} · ${AVISO}`, {
      description: paciente.nombreCompleto,
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground data-[state=open]:bg-accent"
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

          <DropdownMenuItem onSelect={() => setEditando(true)}>
            <Pencil />
            Editar datos
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => setRegistrandoMedida(true)}>
            <ClipboardPlus />
            Registrar medida
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => avisar("Agendar cita")}>
            <CalendarPlus />
            Agendar cita
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmandoBaja(true)}
          >
            <UserX />
            Dar de baja
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogoPaciente
        abierto={editando}
        onOpenChange={setEditando}
        paciente={paciente}
      />

      <DialogoMedida
        abierto={registrandoMedida}
        onOpenChange={setRegistrandoMedida}
        pacienteId={paciente.id}
      />

      <ConfirmarBaja
        abierto={confirmandoBaja}
        onOpenChange={setConfirmandoBaja}
        paciente={paciente}
        onConfirmado={onDarbaja}
      />
    </>
  );
}

function ConfirmarBaja({
  abierto,
  onOpenChange,
  paciente,
  onConfirmado,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  paciente: Paciente;
  onConfirmado?: () => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const baja = useMutation({
    mutationFn: (id: Guid) => pacientesApi.darDeBaja(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pacientesKeys.lista() });
      toast.success("Paciente dado de baja", {
        description: paciente.nombreCompleto,
      });
      onOpenChange(false);
      onConfirmado?.();
    },
    onError: (fallo) => {
      setError(mensajeDeError(fallo));
    },
  });

  return (
    <AlertDialog open={abierto} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Dar de baja a {paciente.nombreCompleto}?</AlertDialogTitle>
          <AlertDialogDescription>
            El paciente dejara de aparecer en el listado y no podra volver a
            entrar por la aplicacion. Su historial clinico se conserva intacto.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={baja.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={baja.isPending}
            onClick={(evento) => {
              evento.preventDefault();
              setError(null);
              baja.mutate(paciente.id);
            }}
          >
            {baja.isPending ? "Dando de baja..." : "Dar de baja"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
