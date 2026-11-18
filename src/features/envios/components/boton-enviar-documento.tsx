import { useState, type ComponentProps } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TipoDocumento } from "@/features/envios/api/envios-api";
import { DialogoEnviarDocumento } from "@/features/envios/components/dialogo-enviar-documento";
import type { Guid } from "@/types/api";

/** Boton "Enviar" que abre la confirmacion de envio por correo. */
export function BotonEnviarDocumento({
  tipo,
  referenciaId,
  pacienteId,
  documento,
  etiqueta = "Enviar",
  ...props
}: {
  tipo: TipoDocumento;
  referenciaId: Guid;
  pacienteId: Guid;
  documento: string;
  etiqueta?: string;
} & Omit<ComponentProps<typeof Button>, "onClick" | "children">) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Button type="button" {...props} onClick={() => setAbierto(true)} aria-label={`${etiqueta}: ${documento}`}>
        <Send className="size-4" />
        {etiqueta}
      </Button>
      <DialogoEnviarDocumento
        abierto={abierto}
        onOpenChange={setAbierto}
        tipo={tipo}
        referenciaId={referenciaId}
        pacienteId={pacienteId}
        documento={documento}
      />
    </>
  );
}
