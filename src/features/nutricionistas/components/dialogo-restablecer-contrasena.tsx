import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertaFormulario } from "@/components/ui/grupo-campos";
import { Label } from "@/components/ui/label";
import { generarContrasenaTemporal, problemaContrasena } from "@/features/auth/lib/permisos";
import { CampoContrasenaTemporal, CredencialesAcceso } from "@/features/nutricionistas/components/comunes";
import { useRestablecerContrasena } from "@/features/nutricionistas/hooks/use-nutricionistas";
import { mensajeDeError } from "@/lib/api-error";
import type { Nutricionista } from "@/types/api";

/** Para quien olvido su contraseña: el administrador le pone una temporal. */
export function DialogoRestablecerContrasena({
  abierto,
  onOpenChange,
  persona,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  persona: Nutricionista;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        {abierto && <Contenido persona={persona} onCerrar={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({ persona, onCerrar }: { persona: Nutricionista; onCerrar: () => void }) {
  const restablecer = useRestablecerContrasena();
  const [contrasena, setContrasena] = useState(generarContrasenaTemporal);
  const [intento, setIntento] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  if (listo) {
    return (
      <>
        <DialogHeader icono={KeyRound}>
          <DialogTitle>Contraseña restablecida</DialogTitle>
          <DialogDescription>
            Se cerraron sus sesiones abiertas. Entrégale estos datos; al entrar elegirá una nueva.
          </DialogDescription>
        </DialogHeader>
        <CredencialesAcceso correo={persona.correoElectronico} contrasena={contrasena} />
        <DialogFooter>
          <Button type="button" onClick={onCerrar}>
            Listo
          </Button>
        </DialogFooter>
      </>
    );
  }

  const confirmar = async () => {
    setIntento(true);
    setError(null);
    if (problemaContrasena(contrasena)) return;
    try {
      await restablecer.mutateAsync({ id: persona.id, contrasena });
      setListo(true);
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  return (
    <>
      <DialogHeader icono={KeyRound}>
        <DialogTitle>Restablecer contraseña</DialogTitle>
        <DialogDescription>
          {persona.nombreCompleto} entrará con esta contraseña temporal y se le pedirá cambiarla.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="contrasena-restablecer">Contraseña temporal</Label>
        <CampoContrasenaTemporal
          id="contrasena-restablecer"
          value={contrasena}
          onChange={setContrasena}
          mostrarError={intento}
        />
      </div>

      {error && <AlertaFormulario>{error}</AlertaFormulario>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => void confirmar()} disabled={restablecer.isPending}>
          {restablecer.isPending && <Loader2 className="size-4 animate-spin" />}
          Restablecer
        </Button>
      </DialogFooter>
    </>
  );
}
