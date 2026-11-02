import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { AlertaFormulario } from "@/components/ui/grupo-campos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authApi } from "@/features/auth/api/auth-api";
import { FormularioContrasena } from "@/features/auth/components/formulario-contrasena";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { SeccionAusencias, SeccionHorario } from "@/features/nutricionistas/components/agenda-persona";
import { CamposPersona } from "@/features/nutricionistas/components/campos-persona";
import { AvatarPersona, InsigniaRol } from "@/features/nutricionistas/components/comunes";
import { nutricionistasKeys } from "@/features/nutricionistas/hooks/use-nutricionistas";
import { dtoDe, esquemaDatosPersona, valoresDe } from "@/features/nutricionistas/lib/equipo";
import { mensajeDeError } from "@/lib/api-error";
import type { Nutricionista } from "@/types/api";

type Pestana = "datos" | "agenda" | "contrasena";

/** "Mi perfil": cada quien edita sus datos y cambia su contraseña. El rol no. */
export function DialogoMiPerfil({
  abierto,
  onOpenChange,
  pestanaInicial = "datos",
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  pestanaInicial?: Pestana;
}) {
  const { usuario } = useAuth();
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        {abierto && usuario && (
          <Contenido usuario={usuario} pestanaInicial={pestanaInicial} onCerrar={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({
  usuario,
  pestanaInicial,
  onCerrar,
}: {
  usuario: Nutricionista;
  pestanaInicial: Pestana;
  onCerrar: () => void;
}) {
  const { actualizarUsuario, cambiarContrasena } = useAuth();
  const queryClient = useQueryClient();
  const [pestana, setPestana] = useState<Pestana>(pestanaInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({ resolver: zodResolver(esquemaDatosPersona), defaultValues: valoresDe(usuario) });

  const enviar = form.handleSubmit(async (valores) => {
    setError(null);
    setGuardando(true);
    try {
      const actualizado = await authApi.actualizarPerfil(dtoDe(valores));
      actualizarUsuario(actualizado);
      void queryClient.invalidateQueries({ queryKey: nutricionistasKeys.all });
      toast.success("Perfil actualizado");
      onCerrar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  });

  return (
    <>
      <DialogHeader icono={UserRound}>
        <DialogTitle>Mi perfil</DialogTitle>
        <DialogDescription>Tus datos de contacto y tu contraseña.</DialogDescription>
      </DialogHeader>

      <div className="bg-surface-subtle flex items-center gap-3 rounded-xl border p-3">
        <AvatarPersona nombre={usuario.nombreCompleto} id={usuario.id} className="size-11 text-sm" />
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate font-semibold">{usuario.nombreCompleto}</p>
          <p className="text-muted-foreground truncate text-xs">{usuario.correoElectronico}</p>
        </div>
        <InsigniaRol rol={usuario.rol} />
      </div>

      <Tabs value={pestana} onValueChange={(v) => setPestana(v as Pestana)}>
        <TabsList className="w-full">
          <TabsTrigger value="datos" className="flex-1">
            Datos
          </TabsTrigger>
          {usuario.rol !== "Recepcion" && (
            <TabsTrigger value="agenda" className="flex-1">
              Mi agenda
            </TabsTrigger>
          )}
          <TabsTrigger value="contrasena" className="flex-1">
            Contraseña
          </TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="mt-4">
          <Form {...form}>
            <form onSubmit={enviar} noValidate className="space-y-5">
              <CamposPersona form={form} profesional={usuario.rol !== "Recepcion"} />
              {error && <AlertaFormulario>{error}</AlertaFormulario>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onCerrar}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando && <Loader2 className="size-4 animate-spin" />}
                  Guardar cambios
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </TabsContent>

        {usuario.rol !== "Recepcion" && (
          <TabsContent value="agenda" className="mt-4 space-y-4">
            <SeccionHorario persona={usuario} editable />
            <SeccionAusencias persona={usuario} editable />
          </TabsContent>
        )}

        <TabsContent value="contrasena" className="mt-4">
          <FormularioContrasena
            onGuardar={async (dto) => {
              await cambiarContrasena(dto);
              toast.success("Contraseña actualizada");
              onCerrar();
            }}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
