import { useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useActualizarMenuAsignado,
  useCrearPlato,
  useDuplicarMenuAsignado,
  usePlatos,
} from "@/features/menus/hooks/use-menus";
import { lineasADetallesDto, lineasDesdeDetalles } from "@/features/menus/lib/menus";
import {
  descripcionVariante,
  esVarianteDe,
  nombreBaseDeVariante,
  nombreVariante,
} from "@/features/menus/lib/variantes";
import { usePacientes } from "@/features/pacientes/hooks/use-pacientes";
import { mensajeDeError } from "@/lib/api-error";
import type { Guid, MenuAsignado } from "@/types/api";

/**
 * Duplicar es la salida de un plan finalizado y la forma de reutilizar un
 * plan ya ajustado con otro paciente. La copia siempre nace en borrador.
 *
 * Al copiar a OTRO paciente, las comidas que usaban variantes del paciente
 * original (platos ajustados solo para el) pasan a variantes propias del
 * nuevo paciente con los mismos ingredientes. Si no, el plan nuevo seguiria
 * apuntando a "Pollo con arroz (Ana)" y cualquier ajuste futuro al plan de
 * Ana cambiaria tambien el del otro paciente.
 */
export function DialogoDuplicarPlan({
  plan,
  onOpenChange,
  onDuplicado,
}: {
  plan: MenuAsignado | null;
  onOpenChange: (abierto: boolean) => void;
  /** Recibe la copia, para abrirla en edicion. */
  onDuplicado?: (copia: MenuAsignado) => void;
}) {
  return (
    <Dialog open={plan !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        {plan && <Contenido plan={plan} onCerrar={() => onOpenChange(false)} onDuplicado={onDuplicado} />}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({
  plan,
  onCerrar,
  onDuplicado,
}: {
  plan: MenuAsignado;
  onCerrar: () => void;
  onDuplicado?: (copia: MenuAsignado) => void;
}) {
  const duplicar = useDuplicarMenuAsignado();
  const crearPlato = useCrearPlato();
  const actualizarCopia = useActualizarMenuAsignado();
  const pacientes = usePacientes();
  const platos = usePlatos({ soloActivos: true, ordenarPor: "nombre" });
  const [nombre, setNombre] = useState(`${plan.nombre} (copia)`);
  const [pacienteId, setPacienteId] = useState(plan.pacienteId);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const otroPaciente = pacienteId !== plan.pacienteId;
  const porId = new Map((platos.data ?? []).map((p) => [p.id, p]));
  const variantesDelOriginal = [
    ...new Set(
      plan.detalles
        .map((d) => d.platoId)
        .filter((id) => {
          const plato = porId.get(id);
          return plato !== undefined && esVarianteDe(plato, plan.pacienteNombre);
        }),
    ),
  ];
  const guardando = duplicar.isPending || crearPlato.isPending || actualizarCopia.isPending;

  /** Crea las variantes del nuevo paciente y apunta la copia a ellas. */
  const trasladarVariantes = async (copia: MenuAsignado): Promise<MenuAsignado> => {
    const reemplazos = new Map<Guid, Guid>();
    for (const id of variantesDelOriginal) {
      const original = porId.get(id)!;
      const nueva = await crearPlato.mutateAsync({
        nombre: nombreVariante(nombreBaseDeVariante(original.nombre, plan.pacienteNombre), copia.pacienteNombre),
        descripcion: descripcionVariante(copia.pacienteNombre),
        imagenUrl: original.imagenUrl,
        detalles: [...original.detalles]
          .sort((a, b) => a.orden - b.orden)
          .map((d, orden) => ({ alimentoId: d.alimentoId, racionGramos: d.racionGramos, orden })),
      });
      reemplazos.set(id, nueva.id);
    }

    const lineas = lineasDesdeDetalles(copia.detalles).map((l) => ({
      ...l,
      platoId: reemplazos.get(l.platoId) ?? l.platoId,
    }));
    return actualizarCopia.mutateAsync({
      menuId: copia.id,
      dto: {
        nombre: copia.nombre,
        descripcion: copia.descripcion,
        objetivoCalorico: copia.objetivoCalorico,
        fechaInicio: null,
        estado: copia.estado,
        detalles: lineasADetallesDto(lineas),
      },
    });
  };

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErrorGeneral(null);
    try {
      let copia = await duplicar.mutateAsync({
        menuId: plan.id,
        dto: { nombre: nombre.trim() === "" ? null : nombre.trim(), pacienteId },
      });
      if (otroPaciente && variantesDelOriginal.length > 0) {
        try {
          copia = await trasladarVariantes(copia);
        } catch (error) {
          /* La copia ya existe: se abre igual y se avisa de lo que falto. */
          toast.warning("El plan se copió, pero no se pudieron pasar los platos ajustados", {
            description: mensajeDeError(error),
          });
        }
      }
      toast.success("Plan duplicado en borrador", { description: `${copia.nombre} · ${copia.pacienteNombre}` });
      onCerrar();
      onDuplicado?.(copia);
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    }
  };

  return (
    <>
      <DialogHeader icono={Copy}>
        <DialogTitle>Duplicar plan</DialogTitle>
        <DialogDescription>
          La copia queda en borrador para que la revises antes de activarla.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={enviar} noValidate className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="duplicar-nombre">Nombre de la copia</Label>
          <Input
            id="duplicar-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={150}
            className="bg-card h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duplicar-paciente">Para el paciente</Label>
          <Select value={pacienteId} onValueChange={setPacienteId}>
            <SelectTrigger id="duplicar-paciente" className="bg-card h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* El paciente original va primero aunque ya no este en la
                  lista de activos, para que el Select siempre tenga etiqueta. */}
              {!pacientes.data?.some((p) => p.id === plan.pacienteId) && (
                <SelectItem value={plan.pacienteId}>{plan.pacienteNombre}</SelectItem>
              )}
              {[...(pacientes.data ?? [])]
                .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, "es"))
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombreCompleto}
                    {p.id === plan.pacienteId && <span className="text-muted-foreground ml-1 text-xs">· actual</span>}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {otroPaciente && variantesDelOriginal.length > 0 && (
          <p className="text-muted-foreground text-xs">
            {variantesDelOriginal.length === 1
              ? "1 plato ajustado para"
              : `${variantesDelOriginal.length} platos ajustados para`}{" "}
            {plan.pacienteNombre} se copiarán como ajustes propios del nuevo paciente.
          </p>
        )}

        {errorGeneral && <AlertaFormulario>{errorGeneral}</AlertaFormulario>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando || platos.isPending}>
            {guardando && <Loader2 className="size-4 animate-spin" />}
            Duplicar
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
