import { useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { DialogoMiPerfil } from "@/features/nutricionistas/components/dialogo-mi-perfil";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { iniciales, tonoDesdeId } from "@/lib/formatters";
import { TONES_AVATAR } from "@/lib/avatar-tonos";
import { cn } from "@/lib/utils";

/* Vive en `components/auth/` junto a `auth-guard.tsx`, que ya es el precedente
   de componente de presentación que consume el contexto de autenticación. El
   resto de `components/` sigue sin importar de `features/`. */
export function MenuUsuario() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [perfilAbierto, setPerfilAbierto] = useState(false);

  /* Sin usuario no hay menú que mostrar. En la práctica AuthGuard ya evita
     llegar aquí sin sesión, pero el guard devuelve null en vez de pintar un
     disparador vacío. */
  if (!usuario) return null;

  const cerrarSesion = async () => {
    await logout();
    /* AuthGuard redirigiría solo al instante siguiente; navegar aquí evita un
       parpadeo del layout protegido con la sesión ya cerrada. */
    navigate("/login", { replace: true });
  };

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 rounded-full pr-2 pl-1.5 data-[state=open]:bg-accent"
          aria-label={`Menú de usuario: ${usuario.nombreCompleto}`}
        >
          <Avatar className="size-7 ring-1 ring-inset ring-black/5 dark:ring-white/10">
            <AvatarFallback
              className={cn(
                "text-[10px] font-semibold select-none",
                TONES_AVATAR[tonoDesdeId(usuario.id)],
              )}
            >
              {iniciales(usuario.nombreCompleto)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-40 truncate text-sm font-medium md:inline">
            {usuario.nombreCompleto}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold text-foreground">
            {usuario.nombreCompleto}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {usuario.correoElectronico}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setPerfilAbierto(true)}>
          <UserRound />
          Mi perfil
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          /* onSelect en vez de onClick: cierra el menú al activarse, que es el
             comportamiento propio de Radix y evita que quede abierto sobre la
             pantalla de login. */
          onSelect={() => void cerrarSesion()}
        >
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <DialogoMiPerfil abierto={perfilAbierto} onOpenChange={setPerfilAbierto} />
    </>
  );
}
