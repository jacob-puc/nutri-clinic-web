import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertaFormulario } from "@/components/ui/grupo-campos";
import { InputUnidad } from "@/components/ui/input-unidad";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CAPTURABLES,
  formatearMetrica,
  type ClaveCapturable,
} from "@/features/consultas/lib/metricas";
import { useActualizarMedida, useRegistrarMedida } from "@/features/pacientes/hooks/use-mutaciones-paciente";
import { mensajeDeError } from "@/lib/api-error";
import type { Guid, MedidaAntropometrica } from "@/types/api";

type Valores = Record<ClaveCapturable, number | undefined>;

/**
 * Captura de medidas dentro de la consulta. Todo es opcional: se anota solo
 * lo que se tomo (p. ej. solo el peso) y cada dato aparece como tarjeta en la
 * consulta. La consulta tiene un unico registro de medidas: el primer guardado
 * lo crea y los siguientes lo completan, asi que tomar la cintura despues del
 * peso no crea una segunda medicion.
 *
 * El backend calcula el IMC y exige peso y estatura en cada registro; la
 * estatura se toma de la ultima medicion para no pedirla en cada visita.
 */
export function DialogoMedidaConsulta({
  abierto,
  onOpenChange,
  pacienteId,
  consultaId,
  medida,
  anterior,
  enfocar,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  pacienteId: Guid;
  consultaId: Guid;
  /** Registro de esta consulta, si ya existe. */
  medida?: MedidaAntropometrica;
  /** Ultima medicion previa: sugiere estatura y sirve de referencia. */
  anterior?: MedidaAntropometrica;
  /** Campo con el foco al abrir (al tocar una tarjeta). */
  enfocar?: ClaveCapturable;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {abierto && (
          <Contenido
            pacienteId={pacienteId}
            consultaId={consultaId}
            medida={medida}
            anterior={anterior}
            enfocar={enfocar}
            onCerrar={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({
  pacienteId,
  consultaId,
  medida,
  anterior,
  enfocar,
  onCerrar,
}: {
  pacienteId: Guid;
  consultaId: Guid;
  medida?: MedidaAntropometrica;
  anterior?: MedidaAntropometrica;
  enfocar?: ClaveCapturable;
  onCerrar: () => void;
}) {
  const registrar = useRegistrarMedida(pacienteId);
  const actualizar = useActualizarMedida(pacienteId);

  const [valores, setValores] = useState<Valores>(() => ({
    peso: medida?.peso,
    estatura: medida?.estatura ?? anterior?.estatura,
    porcentajeGrasa: medida?.porcentajeGrasa ?? undefined,
    porcentajeMasaMuscular: medida?.porcentajeMasaMuscular ?? undefined,
    medidaCintura: medida?.medidaCintura ?? undefined,
    medidaCadera: medida?.medidaCadera ?? undefined,
  }));
  const [notas, setNotas] = useState(medida?.notasObservaciones ?? "");
  const [intento, setIntento] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const errores: Partial<Record<ClaveCapturable, string>> = {};
  for (const campo of CAPTURABLES) {
    const valor = valores[campo.clave];
    if (valor !== undefined && (Number.isNaN(valor) || valor < campo.min || valor > campo.max)) {
      errores[campo.clave] = `Entre ${campo.min} y ${campo.max} ${campo.unidad}.`;
    }
  }
  if (valores.peso === undefined) errores.peso = "El peso es necesario para calcular el IMC.";
  if (valores.estatura === undefined) errores.estatura = "Indica la estatura una vez; luego se reutiliza.";
  const ver = (clave: ClaveCapturable) => (intento ? errores[clave] : undefined);

  const guardando = registrar.isPending || actualizar.isPending;

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setIntento(true);
    setErrorGeneral(null);
    if (Object.keys(errores).length > 0) return;

    const datos = {
      peso: valores.peso!,
      estatura: valores.estatura!,
      porcentajeGrasa: valores.porcentajeGrasa ?? null,
      porcentajeMasaMuscular: valores.porcentajeMasaMuscular ?? null,
      medidaCintura: valores.medidaCintura ?? null,
      medidaCadera: valores.medidaCadera ?? null,
      notasObservaciones: notas.trim() || null,
    };

    try {
      if (medida) {
        await actualizar.mutateAsync({ medidaId: medida.id, datos });
        toast.success("Medidas actualizadas");
      } else {
        await registrar.mutateAsync({ ...datos, consultaId });
      }
      onCerrar();
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    }
  };

  const estaturaReutilizada = !medida && anterior?.estatura !== undefined && valores.estatura === anterior.estatura;

  return (
    <>
      <DialogHeader icono={Ruler}>
        <DialogTitle>{medida ? "Medidas de la consulta" : "Registrar medidas"}</DialogTitle>
        <DialogDescription>
          Anota solo lo que tomaste. Cada dato aparece como tarjeta en la consulta; puedes volver a agregar más.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={enviar} noValidate className="space-y-5">
        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          {CAPTURABLES.map((campo) => {
            const previo = anterior?.[campo.clave];
            const error = ver(campo.clave);
            return (
              <div key={campo.clave} className="space-y-1.5">
                <Label htmlFor={`medida-${campo.clave}`}>
                  {campo.etiqueta}
                  {campo.clave !== "peso" && campo.clave !== "estatura" && (
                    <span className="text-muted-foreground-subtle ml-1 text-xs font-normal">(opcional)</span>
                  )}
                </Label>
                <InputUnidad
                  id={`medida-${campo.clave}`}
                  unidad={campo.unidad}
                  inputMode="decimal"
                  step={campo.paso}
                  autoFocus={campo.clave === (enfocar ?? "peso")}
                  placeholder={previo !== null && previo !== undefined ? formatearMetrica(previo) : undefined}
                  value={valores[campo.clave] ?? ""}
                  aria-invalid={error ? true : undefined}
                  onChange={(e) =>
                    setValores((v) => ({
                      ...v,
                      [campo.clave]: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                />
                {error ? (
                  <p className="text-destructive text-xs">{error}</p>
                ) : campo.clave === "estatura" && estaturaReutilizada ? (
                  <p className="text-muted-foreground text-xs">De la última medición</p>
                ) : previo !== null && previo !== undefined ? (
                  <p className="text-muted-foreground-subtle text-xs">
                    Anterior: {formatearMetrica(previo)} {campo.unidad}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="medida-notas">
            Observaciones <span className="text-muted-foreground-subtle text-xs font-normal">(opcional)</span>
          </Label>
          <Textarea
            id="medida-notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Báscula usada, en ayunas, con ropa…"
            rows={2}
            className="bg-card resize-none"
          />
        </div>

        {errorGeneral && <AlertaFormulario>{errorGeneral}</AlertaFormulario>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
