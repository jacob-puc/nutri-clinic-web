import { useState } from "react";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AlertaFormulario } from "@/components/ui/grupo-campos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CambiarContrasenaDto } from "@/features/auth/types/auth";
import { mensajeDeError } from "@/lib/api-error";
import { cn } from "@/lib/utils";

const REGLAS: Array<{ texto: string; cumple: (c: string) => boolean }> = [
  { texto: "8 caracteres o más", cumple: (c) => c.length >= 8 },
  { texto: "Una mayúscula", cumple: (c) => /[A-ZÁÉÍÓÚÑ]/.test(c) },
  { texto: "Un número", cumple: (c) => /\d/.test(c) },
];

/**
 * Cambio de contraseña propia: actual, nueva y confirmacion, con las reglas
 * del backend a la vista mientras se escribe. Lo usan la pantalla de primer
 * acceso y "Mi perfil".
 */
export function FormularioContrasena({
  etiquetaActual = "Contraseña actual",
  textoBoton = "Cambiar contraseña",
  onGuardar,
  className,
}: {
  etiquetaActual?: string;
  textoBoton?: string;
  onGuardar: (dto: CambiarContrasenaDto) => Promise<void>;
  className?: string;
}) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [visible, setVisible] = useState(false);
  const [intento, setIntento] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cumpleTodas = REGLAS.every((r) => r.cumple(nueva));
  const coinciden = nueva === confirmacion;
  const errorConfirmacion = intento && confirmacion !== "" && !coinciden ? "No coincide con la contraseña nueva." : null;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntento(true);
    setError(null);
    if (!actual || !cumpleTodas || !coinciden) return;
    setGuardando(true);
    try {
      await onGuardar({ contrasenaActual: actual, contrasenaNueva: nueva });
      setActual("");
      setNueva("");
      setConfirmacion("");
      setIntento(false);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const tipo = visible ? "text" : "password";

  return (
    <form onSubmit={enviar} noValidate className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="contrasena-actual">{etiquetaActual}</Label>
        <Input
          id="contrasena-actual"
          type={tipo}
          autoComplete="current-password"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          className="bg-card h-10"
          aria-invalid={intento && !actual ? true : undefined}
        />
        {intento && !actual && <p className="text-destructive text-sm">Escribe tu contraseña actual.</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="contrasena-nueva">Contraseña nueva</Label>
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-xs"
          >
            {visible ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
            {visible ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <Input
          id="contrasena-nueva"
          type={tipo}
          autoComplete="new-password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          className="bg-card h-10"
          aria-invalid={intento && !cumpleTodas ? true : undefined}
          aria-describedby="reglas-contrasena"
        />
        <ul id="reglas-contrasena" className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
          {REGLAS.map((regla) => {
            const ok = regla.cumple(nueva);
            return (
              <li
                key={regla.texto}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-colors",
                  ok ? "text-success" : intento ? "text-destructive" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-3.5 place-items-center rounded-full border",
                    ok ? "border-success bg-success text-success-foreground" : "border-current",
                  )}
                  aria-hidden
                >
                  {ok && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                {regla.texto}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contrasena-confirmacion">Confirma la contraseña nueva</Label>
        <Input
          id="contrasena-confirmacion"
          type={tipo}
          autoComplete="new-password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          className="bg-card h-10"
          aria-invalid={errorConfirmacion || (intento && !confirmacion) ? true : undefined}
        />
        {errorConfirmacion && <p className="text-destructive text-sm">{errorConfirmacion}</p>}
        {intento && !confirmacion && <p className="text-destructive text-sm">Repite la contraseña nueva.</p>}
      </div>

      {error && <AlertaFormulario>{error}</AlertaFormulario>}

      <Button type="submit" className="h-10 w-full" disabled={guardando}>
        {guardando && <Loader2 className="size-4 animate-spin" />}
        {textoBoton}
      </Button>
    </form>
  );
}
