import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlus,
  ClipboardPlus,
  MoreHorizontal,
  Pencil,
  Smartphone,
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
import { DialogoCita } from "@/features/citas/components/dialogo-cita";
import { DialogoMedida } from "@/features/pacientes/components/dialogo-medida";
import { DialogoPaciente } from "@/features/pacientes/components/dialogo-paciente";
import { pacientesApi } from "@/features/pacientes/api/pacientes-api";
import { pacientesKeys, useEstadosApp } from "@/features/pacientes/hooks/use-pacientes";
import { formatearFechaCorta } from "@/lib/formatters";
import { mensajeDeError } from "@/lib/api-error";
import type { Guid, Paciente } from "@/types/api";

interface AccionesPacienteProps {
  paciente: Paciente;
  onDarbaja?: () => void;
}

export function AccionesPaciente({ paciente, onDarbaja }: AccionesPacienteProps) {
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [registrandoMedida, setRegistrandoMedida] = useState(false);
  const [agendando, setAgendando] = useState(false);
  const [invitando, setInvitando] = useState(false);
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);

  /* La invitacion solo se ofrece a quien todavia no tiene cuenta en la app. */
  const estados = useEstadosApp();
  const estado = estados.data?.get(paciente.id);
  const sinApp = estados.isSuccess && !estado?.tieneApp;

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
          <DropdownMenuItem onSelect={() => navigate(`/pacientes/${paciente.id}`)}>
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

          <DropdownMenuItem onSelect={() => setAgendando(true)}>
            <CalendarPlus />
            Agendar cita
          </DropdownMenuItem>

          {sinApp && (
            <DropdownMenuItem onSelect={() => setInvitando(true)}>
              <Smartphone />
              {estado?.invitadoEn ? "Reenviar invitación a la app" : "Invitar a la app"}
            </DropdownMenuItem>
          )}

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

      <DialogoCita
        abierto={agendando}
        onOpenChange={setAgendando}
        pacienteId={paciente.id}
        pacienteNombre={paciente.nombreCompleto}
      />

      <ConfirmarInvitacion
        abierto={invitando}
        onOpenChange={setInvitando}
        paciente={paciente}
        invitadoEn={estado?.invitadoEn ?? null}
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

/** Confirmacion antes de mandar la invitacion: a quien llega y que dice. */
function ConfirmarInvitacion({
  abierto,
  onOpenChange,
  paciente,
  invitadoEn,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  paciente: Paciente;
  invitadoEn: string | null;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const correo = paciente.correoElectronico?.trim();

  const invitar = useMutation({
    mutationFn: () => pacientesApi.invitarApp(paciente.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pacientesKeys.estadosApp() });
      toast.success("Invitación en camino", { description: `${paciente.nombreCompleto} · ${correo}` });
      onOpenChange(false);
    },
    onError: (fallo) => setError(mensajeDeError(fallo)),
  });

  return (
    <AlertDialog
      open={abierto}
      onOpenChange={(valor) => {
        if (!valor) setError(null);
        onOpenChange(valor);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Invitar a {paciente.nombreCompleto} a la app?</AlertDialogTitle>
          <AlertDialogDescription>
            {correo ? (
              <>
                Le enviaremos a <span className="text-foreground font-medium">{correo}</span> un correo con los pasos
                para crear su cuenta. Al usar ese mismo correo, su cuenta se vincula sola a su expediente.
              </>
            ) : (
              "Este paciente no tiene correo registrado. Agrégalo en «Editar datos» para poder invitarlo."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {invitadoEn && (
          <p className="bg-info-soft text-info-soft-foreground rounded-lg px-3 py-2 text-sm">
            Ya se le invitó el {formatearFechaCorta(invitadoEn)}. Puedes reenviarla si no la encontró.
          </p>
        )}

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={invitar.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={invitar.isPending || !correo}
            onClick={(evento) => {
              evento.preventDefault();
              setError(null);
              invitar.mutate();
            }}
          >
            {invitar.isPending ? "Enviando..." : invitadoEn ? "Reenviar invitación" : "Enviar invitación"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
            entrar por la aplicación. Su historial clínico se conserva intacto.
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
