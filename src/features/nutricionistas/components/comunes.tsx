import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DESCRIPCION_ROL, ETIQUETA_ROL, generarContrasenaTemporal, problemaContrasena } from "@/features/auth/lib/permisos";
import { ICONO_ROL, ROLES, TONO_ROL } from "@/features/nutricionistas/lib/equipo";
import { TONES_AVATAR } from "@/lib/avatar-tonos";
import { iniciales, tonoDesdeId } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { RolUsuario } from "@/types/api";

export function AvatarPersona({ nombre, id, className }: { nombre: string; id: string; className?: string }) {
  return (
    <Avatar className={cn("size-10 shrink-0", className)}>
      <AvatarFallback className={cn("font-semibold select-none", TONES_AVATAR[tonoDesdeId(id)])}>
        {iniciales(nombre)}
      </AvatarFallback>
    </Avatar>
  );
}

export function InsigniaRol({ rol, className }: { rol: RolUsuario; className?: string }) {
  const Icono = ICONO_ROL[rol];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        TONO_ROL[rol],
        className,
      )}
    >
      <Icono className="size-3" aria-hidden />
      {ETIQUETA_ROL[rol]}
    </span>
  );
}

/**
 * Eleccion de rol como tarjetas: cada una dice que puede hacer, porque la
 * diferencia (sobre todo la de recepcion) no se adivina por el nombre.
 */
export function SelectorRol({
  value,
  onChange,
  disabled,
}: {
  value: RolUsuario;
  onChange: (rol: RolUsuario) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Rol" className="grid gap-2 sm:grid-cols-3">
      {ROLES.map((rol) => {
        const Icono = ICONO_ROL[rol];
        const activo = value === rol;
        return (
          <button
            key={rol}
            type="button"
            role="radio"
            aria-checked={activo}
            disabled={disabled}
            onClick={() => onChange(rol)}
            className={cn(
              "relative flex cursor-pointer flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors outline-none",
              "focus-visible:ring-primary/25 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60",
              activo ? "border-primary bg-primary-soft/40 shadow-[inset_0_0_0_1px_var(--primary)]" : "hover:bg-accent",
            )}
          >
            <span className="flex w-full items-center justify-between">
              <span className={cn("grid size-7 place-items-center rounded-md ring-1 ring-inset", TONO_ROL[rol])}>
                <Icono className="size-4" aria-hidden />
              </span>
              <span
                aria-hidden
                className={cn(
                  "grid size-4 place-items-center rounded-full border",
                  activo ? "border-primary bg-primary text-primary-foreground" : "border-border-strong",
                )}
              >
                {activo && <Check className="size-2.5" strokeWidth={3} />}
              </span>
            </span>
            <span className="text-foreground text-sm font-semibold">{ETIQUETA_ROL[rol]}</span>
            <span className="text-muted-foreground text-xs leading-snug">{DESCRIPCION_ROL[rol]}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Campo de contraseña temporal: viene generada, se puede regenerar o escribir. */
export function CampoContrasenaTemporal({
  id,
  value,
  onChange,
  mostrarError,
}: {
  id: string;
  value: string;
  onChange: (valor: string) => void;
  mostrarError?: boolean;
}) {
  const problema = problemaContrasena(value);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="bg-card h-10 font-mono tracking-wide"
          aria-invalid={mostrarError && problema ? true : undefined}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          aria-label="Generar otra contraseña"
          onClick={() => onChange(generarContrasenaTemporal())}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>
      <p className={cn("text-xs", mostrarError && problema ? "text-destructive" : "text-muted-foreground")}>
        {mostrarError && problema ? problema : "Se pedirá cambiarla en el primer inicio de sesión."}
      </p>
    </div>
  );
}

/**
 * Datos para entregar a la persona tras el alta o un restablecimiento. El
 * sistema no envia correos, asi que se copian y se comparten a mano.
 */
export function CredencialesAcceso({ correo, contrasena }: { correo: string; contrasena: string }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    const texto = `NutriClínica\nCorreo: ${correo}\nContraseña temporal: ${contrasena}\nAl entrar se te pedirá elegir una contraseña propia.`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("No se pudo copiar", { description: "Selecciona el texto y cópialo a mano." });
    }
  };

  return (
    <div className="bg-surface-subtle rounded-xl border p-4">
      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">Correo</dt>
          <dd className="text-foreground font-medium break-all">{correo}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Contraseña temporal</dt>
          <dd className="text-foreground font-mono text-base font-semibold tracking-wide">{contrasena}</dd>
        </div>
      </dl>
      <Button type="button" variant="outline" size="sm" className="mt-4 w-full" onClick={() => void copiar()}>
        {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copiado ? "Copiado" : "Copiar datos de acceso"}
      </Button>
    </div>
  );
}
