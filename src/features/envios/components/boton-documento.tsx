import { useState, type ComponentProps } from "react";
import { ChevronDown, FileText, Printer, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TipoDocumento } from "@/features/envios/api/envios-api";
import { DialogoEnviarDocumento } from "@/features/envios/components/dialogo-enviar-documento";
import { abrirPdfConAviso } from "@/lib/pdf";
import type { Guid } from "@/types/api";

/**
 * Un solo boton para un documento (plan, historial): al abrirlo ofrece
 * imprimirlo en PDF o enviarlo por correo al paciente (con confirmacion).
 * Sin `envio`, solo queda la opcion de imprimir.
 */
export function BotonDocumento({
  etiqueta = "Documento",
  imprimir,
  envio,
  ...props
}: {
  etiqueta?: string;
  /** Abre el PDF (p. ej. `() => menusApi.abrirMenuPdf(id)`). */
  imprimir: () => Promise<void>;
  envio?: {
    tipo: TipoDocumento;
    referenciaId: Guid;
    pacienteId: Guid;
    documento: string;
  };
} & Omit<ComponentProps<typeof Button>, "onClick" | "children">) {
  const [enviando, setEnviando] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" {...props}>
            <FileText className="size-4" />
            {etiqueta}
            <ChevronDown className="size-3.5 opacity-70" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => abrirPdfConAviso(imprimir)}>
            <Printer aria-hidden />
            Imprimir o descargar
          </DropdownMenuItem>
          {envio && (
            <DropdownMenuItem onSelect={() => setEnviando(true)}>
              <Send aria-hidden />
              Enviar por correo
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {envio && (
        <DialogoEnviarDocumento
          abierto={enviando}
          onOpenChange={setEnviando}
          tipo={envio.tipo}
          referenciaId={envio.referenciaId}
          pacienteId={envio.pacienteId}
          documento={envio.documento}
        />
      )}
    </>
  );
}
