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
      offset={{ bottom: 24, right: 24 }}
      mobileOffset={{ bottom: 16, left: 12, right: 12 }}
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
            "group/aviso relative flex w-[var(--width)] items-start gap-3 overflow-hidden rounded-2xl border py-3.5 pr-10 pl-3.5",
            "bg-popover text-popover-foreground shadow-overlay",
            /* Valores por defecto (avisos neutros y de carga): color de marca. */
            "[--tono:var(--primary)] [--tono-suave:var(--primary-soft)] [--tono-texto:var(--primary-soft-foreground)]",
            TONO,
            /* Borde y un velo muy suave del color del aviso, como las tarjetas del sitio. */
            "border-[color-mix(in_oklab,var(--tono)_28%,transparent)]",
            "bg-[linear-gradient(135deg,color-mix(in_oklab,var(--tono-suave)_55%,transparent),transparent_60%)]",
            /* Hilo del color del aviso en la base: el sello de la tarjeta. */
            "after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-[var(--tono)] after:opacity-80",
          ),
          icon: cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            "bg-[var(--tono)] text-white shadow-[0_6px_14px_-6px_var(--tono)]",
            "[&_svg]:size-[18px]",
          ),
          content: "flex min-w-0 flex-1 flex-col gap-0.5 pt-1",
          title: "text-foreground text-[14px] leading-snug font-semibold",
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
