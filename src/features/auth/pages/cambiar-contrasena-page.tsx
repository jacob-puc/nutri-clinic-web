import { KeyRound, Leaf, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormularioContrasena } from "@/features/auth/components/formulario-contrasena";
import { useAuth } from "@/features/auth/hooks/use-auth";

/**
 * Primer acceso con la contraseña temporal que puso el administrador: antes
 * de entrar a la app hay que elegir una propia. El backend tambien lo exige
 * (responde 403 al resto de la API mientras no se cambie).
 */
export function CambiarContrasenaPage() {
  const { usuario, cambiarContrasena, logout } = useAuth();
  const navigate = useNavigate();

  const nombre = usuario?.nombreCompleto.split(" ")[0] ?? "";

  return (
    <div className="bg-background relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,var(--primary-soft),transparent)]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-[linear-gradient(145deg,var(--brand-500),var(--brand-800))] text-white">
            <Leaf className="size-4.5" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="text-foreground text-lg font-semibold tracking-tight">NutriClínica</span>
        </div>

        <div className="hoja rounded-2xl p-6 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.18)] sm:p-8">
          <span className="bg-primary-soft text-primary-soft-foreground grid size-11 place-items-center rounded-xl">
            <KeyRound className="size-5" aria-hidden />
          </span>
          <h1 className="font-editorial text-foreground mt-4 text-3xl font-normal tracking-tight">
            {nombre ? `Bienvenido, ${nombre}` : "Bienvenido"}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Entraste con una contraseña temporal. Elige una propia para continuar; solo tú la vas a conocer.
          </p>

          <FormularioContrasena
            className="mt-6"
            etiquetaActual="Contraseña temporal"
            textoBoton="Guardar y entrar"
            onGuardar={async (dto) => {
              await cambiarContrasena(dto);
              toast.success("Contraseña actualizada", { description: "Ya puedes usar NutriClínica." });
            }}
          />
        </div>

        <div className="mt-5 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={async () => {
              await logout();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut className="size-4" />
            Salir y entrar con otra cuenta
          </Button>
        </div>
      </div>
    </div>
  );
}
