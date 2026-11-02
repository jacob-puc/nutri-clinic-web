import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

/*
 * Avisos con la piel de la app en lugar de los bloques de color de Sonner
 * (`richColors`): tarjeta del tema, una franja y una teja de icono con el
 * color del estado, y el titulo separado de la descripcion. El color dice
 * el tipo de aviso sin pintar toda la tarjeta, que en una pantalla clinica
 * se siente alarmante para un simple "Guardado".
 *
 * `unstyled` desactiva los estilos propios de Sonner; el tipo llega como
 * `data-type` en la tarjeta y de ahi se tiñen la franja y el icono.
 */
const TONO = cn(
  "data-[type=success]:[--tono:var(--success)] data-[type=success]:[--tono-suave:var(--success-soft)] data-[type=success]:[--tono-texto:var(--success-soft-foreground)]",
  "data-[type=error]:[--tono:var(--destructive)] data-[type=error]:[--tono-suave:var(--destructive-soft)] data-[type=error]:[--tono-texto:var(--destructive-soft-foreground)]",
  "data-[type=warning]:[--tono:var(--warning)] data-[type=warning]:[--tono-suave:var(--warning-soft)] data-[type=warning]:[--tono-texto:var(--warning-soft-foreground)]",
  "data-[type=info]:[--tono:var(--info)] data-[type=info]:[--tono-suave:var(--info-soft)] data-[type=info]:[--tono-texto:var(--info-soft-foreground)]",
)

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      {...props}
      theme={theme}
      className="toaster group"
      gap={10}
      offset={{ top: 76, right: 20 }}
      mobileOffset={{ top: 72, left: 12, right: 12 }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: cn(
            "group/aviso relative flex w-[var(--width)] items-start gap-3 overflow-hidden rounded-xl border py-3 pr-9 pl-4",
            "bg-popover text-popover-foreground border-border shadow-overlay",
            /* Valores por defecto (avisos neutros y de carga): color de marca. */
            "[--tono:var(--primary)] [--tono-suave:var(--primary-soft)] [--tono-texto:var(--primary-soft-foreground)]",
            TONO,
            /* Franja de estado en el borde izquierdo. */
            "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--tono)]",
          ),
          icon: cn(
            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg",
            "bg-[var(--tono-suave)] text-[var(--tono-texto)]",
          ),
          content: "flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5",
          title: "text-foreground text-sm leading-snug font-semibold",
          description: "text-muted-foreground text-[13px] leading-snug",
          actionButton: cn(
            "bg-primary text-primary-foreground hover:bg-primary-hover mt-0.5 h-7 shrink-0 cursor-pointer self-center rounded-md px-2.5 text-xs font-semibold",
          ),
          cancelButton:
            "text-muted-foreground hover:bg-accent mt-0.5 h-7 shrink-0 cursor-pointer self-center rounded-md px-2.5 text-xs font-medium",
          closeButton: cn(
            "text-muted-foreground hover:text-foreground hover:bg-accent absolute top-2.5 right-2.5 grid size-6 cursor-pointer place-items-center rounded-md transition-colors",
            "[&_svg]:size-3.5",
          ),
        },
      }}
    />
  )
}

export { Toaster }
