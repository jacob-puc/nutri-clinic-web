import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, UserRoundPen } from "lucide-react";
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
import { AlertaFormulario, GrupoCampos } from "@/components/ui/grupo-campos";
import { Label } from "@/components/ui/label";
import { generarContrasenaTemporal, problemaContrasena } from "@/features/auth/lib/permisos";
import { CamposPersona } from "@/features/nutricionistas/components/campos-persona";
import {
  CampoContrasenaTemporal,
  CredencialesAcceso,
  SelectorRol,
} from "@/features/nutricionistas/components/comunes";
import { useActualizarNutricionista, useCrearNutricionista } from "@/features/nutricionistas/hooks/use-nutricionistas";
import { dtoDe, esquemaDatosPersona, valoresDe } from "@/features/nutricionistas/lib/equipo";
import { mensajeDeError } from "@/lib/api-error";
import type { Nutricionista, RolUsuario } from "@/types/api";

/**
 * Alta o edicion de una persona del equipo (solo administrador). El alta
 * termina mostrando los datos de acceso para entregarlos, porque el sistema
 * no envia correos.
 */
export function DialogoNutricionista({
  abierto,
  onOpenChange,
  persona,
  esPropia = false,
  onCreada,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  persona?: Nutricionista | null;
  /** La propia cuenta: el rol no se puede cambiar. */
  esPropia?: boolean;
  onCreada?: (persona: Nutricionista) => void;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        {abierto && (
          <Contenido
            persona={persona ?? null}
            esPropia={esPropia}
            onCerrar={() => onOpenChange(false)}
            onCreada={onCreada}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({
  persona,
  esPropia,
  onCerrar,
  onCreada,
}: {
  persona: Nutricionista | null;
  esPropia: boolean;
  onCerrar: () => void;
  onCreada?: (persona: Nutricionista) => void;
}) {
  const crear = useCrearNutricionista();
  const actualizar = useActualizarNutricionista();
  const [rol, setRol] = useState<RolUsuario>(persona?.rol ?? "Nutricionista");
  const [contrasena, setContrasena] = useState(generarContrasenaTemporal);
  const [intento, setIntento] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creada, setCreada] = useState<{ persona: Nutricionista; contrasena: string } | null>(null);

  const form = useForm({ resolver: zodResolver(esquemaDatosPersona), defaultValues: valoresDe(persona) });

  if (creada) {
    return (
      <>
        <DialogHeader icono={UserPlus}>
          <DialogTitle>{creada.persona.nombreCompleto} ya tiene cuenta</DialogTitle>
          <DialogDescription>
            Entrégale estos datos. Al entrar por primera vez elegirá su propia contraseña.
          </DialogDescription>
        </DialogHeader>
        <CredencialesAcceso correo={creada.persona.correoElectronico} contrasena={creada.contrasena} />
        <DialogFooter>
          <Button
            type="button"
            onClick={() => {
              onCerrar();
              onCreada?.(creada.persona);
            }}
          >
            Listo
          </Button>
        </DialogFooter>
      </>
    );
  }

  const guardando = crear.isPending || actualizar.isPending;

  const enviar = form.handleSubmit(
    async (valores) => {
      setIntento(true);
      setError(null);
      const datos = dtoDe(valores);
      if (rol === "Recepcion") {
        datos.especialidad = null;
        datos.numeroColegiatura = null;
      }
      try {
        if (persona) {
          await actualizar.mutateAsync({ id: persona.id, dto: { ...datos, rol: esPropia ? null : rol } });
          toast.success("Datos actualizados", { description: datos.nombreCompleto });
          onCerrar();
        } else {
          if (problemaContrasena(contrasena)) return;
          const nueva = await crear.mutateAsync({ ...datos, rol, contrasena });
          setCreada({ persona: nueva, contrasena });
        }
      } catch (err) {
        setError(mensajeDeError(err));
      }
    },
    () => setIntento(true),
  );

  return (
    <>
      <DialogHeader icono={persona ? UserRoundPen : UserPlus}>
        <DialogTitle>{persona ? "Editar datos" : "Agregar al equipo"}</DialogTitle>
        <DialogDescription>
          {persona
            ? "Datos de contacto, profesionales y rol de la cuenta."
            : "Crea su cuenta con una contraseña temporal; la cambiará al entrar."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={enviar} noValidate className="space-y-5">
          <GrupoCampos titulo="Rol">
            <SelectorRol value={rol} onChange={setRol} disabled={esPropia} />
            {esPropia && (
              <p className="text-muted-foreground text-xs">No puedes cambiar tu propio rol; pídeselo a otro administrador.</p>
            )}
          </GrupoCampos>

          <GrupoCampos titulo="Datos">
            <CamposPersona form={form} profesional={rol !== "Recepcion"} />
          </GrupoCampos>

          {!persona && (
            <GrupoCampos titulo="Acceso">
              <div className="space-y-2">
                <Label htmlFor="contrasena-temporal">Contraseña temporal</Label>
                <CampoContrasenaTemporal
                  id="contrasena-temporal"
                  value={contrasena}
                  onChange={setContrasena}
                  mostrarError={intento}
                />
              </div>
            </GrupoCampos>
          )}

          {error && <AlertaFormulario>{error}</AlertaFormulario>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando && <Loader2 className="size-4 animate-spin" />}
              {persona ? "Guardar cambios" : "Crear cuenta"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
