import { CLINICA } from "@/config/clinica";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function LogoClinica({ className }: LogoProps) {
  return (
    <img src="/favicon.svg" alt="" className={cn("block rounded-lg shadow-subtle", className)} />
  );
}

export function LogoConTexto({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoClinica className="size-9 rounded-lg" />
      <span className="flex flex-col leading-none">
        <span className="font-editorial text-foreground text-lg font-medium tracking-tight">
          {CLINICA.nombre}
        </span>
        <span className="text-muted-foreground mt-0.5 text-[11px] font-medium">
          Nutrición clínica
        </span>
      </span>
    </span>
  );
}
