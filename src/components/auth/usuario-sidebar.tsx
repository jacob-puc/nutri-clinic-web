import { useState } from "react";
import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { ETIQUETA_ROL } from "@/features/auth/lib/permisos";
import { DialogoMiPerfil } from "@/features/nutricionistas/components/dialogo-mi-perfil";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipSimple } from "@/components/ui/tooltip-simple";
import { TONES_AVATAR } from "@/lib/avatar-tonos";
import { iniciales, tonoDesdeId } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de la sesion al pie del menu lateral. En escritorio sustituye al
 * menu de usuario de la barra superior, donde el nombre se cortaba; plegado
 * queda solo el avatar.
 */
export function UsuarioSidebar({ collapsed }: { collapsed: boolean }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [perfilAbierto, setPerfilAbierto] = useState(false);

  if (!usuario) return null;

  const cerrarSesion = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const disparador = (
    <DropdownMenuTrigger
      className={cn(
        "flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-1.5 text-left outline-none",
        "transition-colors duration-200 hover:bg-sidebar-hover data-[state=open]:bg-sidebar-hover",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        collapsed && "justify-center",
      )}
      aria-label={`Menú de usuario: ${usuario.nombreCompleto}`}
    >
      <Avatar className="size-8 shrink-0 ring-1 ring-white/15 ring-inset">
        <AvatarFallback
          className={cn("text-[11px] font-semibold select-none", TONES_AVATAR[tonoDesdeId(usuario.id)])}
        >
          {iniciales(usuario.nombreCompleto)}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="text-sidebar-foreground block truncate text-sm font-semibold">
              {usuario.nombreCompleto}
            </span>
            <span className="text-sidebar-muted-foreground block truncate text-xs">
              {ETIQUETA_ROL[usuario.rol]}
            </span>
          </span>
          <ChevronsUpDown className="text-sidebar-muted-foreground size-4 shrink-0" aria-hidden />
        </>
      )}
    </DropdownMenuTrigger>
  );

  return (
    <>
    <DropdownMenu>
      {collapsed ? (
        <TooltipSimple side="right" contenido={usuario.nombreCompleto}>
          {disparador}
        </TooltipSimple>
      ) : (
        disparador
      )}
      <DropdownMenuContent side="right" align="end" sideOffset={10} className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="text-foreground truncate text-sm font-semibold">{usuario.nombreCompleto}</p>
          <p className="text-muted-foreground truncate text-xs">{usuario.correoElectronico}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setPerfilAbierto(true)}>
          <UserRound />
          Mi perfil
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => void cerrarSesion()}>
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <DialogoMiPerfil abierto={perfilAbierto} onOpenChange={setPerfilAbierto} />
    </>
  );
}
