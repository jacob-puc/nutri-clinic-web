import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import type { ThemePreference } from "@/hooks/use-theme";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, preference, setTheme } = useTheme();

  const opciones: Array<{ valor: ThemePreference; etiqueta: string }> = [
    { valor: "light", etiqueta: "Claro" },
    { valor: "dark", etiqueta: "Oscuro" },
    { valor: "system", etiqueta: "Automatico" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? (
            <Moon className="size-4.5" />
          ) : (
            <Sun className="size-4.5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {opciones.map((opcion) => (
          <DropdownMenuItem
            key={opcion.valor}
            onClick={() => {
              setTheme(opcion.valor);
            }}
            className={
              preference === opcion.valor
                ? "bg-accent text-accent-foreground"
                : undefined
            }
          >
            {opcion.etiqueta}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
