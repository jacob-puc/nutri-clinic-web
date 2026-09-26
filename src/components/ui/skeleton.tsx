import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // bg-muted y no bg-accent: --accent es la superficie de hover, asi que
      // un skeleton en accent se veria identique a como se ve el hover de una
      // fila real. El gris de --muted es lo que distingue "cargando" de
      // "sobrevolando".
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
