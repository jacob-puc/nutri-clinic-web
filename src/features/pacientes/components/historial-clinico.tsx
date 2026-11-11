import { useState, type KeyboardEvent } from "react";
import { AlertTriangle, Ban, Heart, Loader2, Pencil, Plus, Stethoscope, X, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Seccion } from "@/components/ficha/seccion";
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
import { Sugerencias } from "@/components/ui/sugerencias";
import { useGuardarHistorial } from "@/features/pacientes/hooks/use-mutaciones-paciente";
import { mensajeDeError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { CrearHistorialClinicoDto, Guid, HistorialClinico } from "@/types/api";

type Campo = keyof CrearHistorialClinicoDto;
type Tono = "condicion" | "alerta" | "favorito" | "evitar";

/* Mismo orden en la ficha y en el editor: lo clinico primero. */
const CAMPOS: {
  campo: Campo;
  etiqueta: string;
  vacio: string;
  tono: Tono;
  icono: LucideIcon;
  ejemplo: string;
  sugerencias: string[];
}[] = [
  {
    campo: "enfermedades",
    etiqueta: "Enfermedades",
    vacio: "Sin enfermedades registradas",
    tono: "condicion",
    icono: Stethoscope,
    ejemplo: "Ej. Diabetes tipo 2",
    sugerencias: ["Diabetes tipo 2", "Hipertensión", "Colesterol alto", "Hipotiroidismo", "Gastritis", "Resistencia a la insulina"],
  },
  {
    campo: "alergias",
    etiqueta: "Alergias",
    vacio: "Sin alergias registradas",
    tono: "alerta",
    icono: AlertTriangle,
    ejemplo: "Ej. Nueces",
    sugerencias: ["Nueces", "Cacahuate", "Mariscos", "Lácteos", "Huevo", "Gluten"],
  },
  {
    campo: "alimentosFavoritos",
    etiqueta: "Le gustan",
    vacio: "Sin alimentos favoritos",
    tono: "favorito",
    icono: Heart,
    ejemplo: "Ej. Pollo",
    sugerencias: [],
  },
  {
    campo: "alimentosNoFavoritos",
    etiqueta: "Prefiere evitar",
    vacio: "Sin alimentos que evite",
    tono: "evitar",
    icono: Ban,
    ejemplo: "Ej. Hígado",
    sugerencias: [],
  },
];

/** Cada grupo se distingue por icono y tono, no solo por el texto. */
const CHIP: Record<Tono, string> = {
  condicion: "bg-info-soft text-info-soft-foreground ring-info/30",
  alerta: "bg-destructive-soft text-destructive-soft-foreground ring-destructive/30",
  favorito: "bg-success-soft text-success-soft-foreground ring-success/30",
  evitar: "bg-secondary text-secondary-foreground ring-ring/40",
};

/** Nada capturado todavia: sin historial o con todas las listas vacias. */
export function historialVacio(historial: HistorialClinico | null | undefined) {
  return !historial || CAMPOS.every(({ campo }) => (historial[campo] ?? []).length === 0);
}

const VACIO: CrearHistorialClinicoDto = { enfermedades: [], alergias: [], alimentosFavoritos: [], alimentosNoFavoritos: [] };

/**
 * Historial clinico del paciente: enfermedades, alergias y gustos. Lo usan el
 * expediente y la consulta; los avisos de alergias del plan salen de aqui.
 */
export function PanelHistorialClinico({
  pacienteId,
  historial,
  editable = true,
  className,
}: {
  pacienteId: Guid;
  historial: HistorialClinico | null | undefined;
  editable?: boolean;
  className?: string;
}) {
  const [editando, setEditando] = useState(false);
  const vacio = historialVacio(historial);

  return (
    <Seccion
      titulo="Historial clínico"
      icono={Stethoscope}
      meta="Salud, alergias y preferencias"
      className={className}
      acciones={
        editable && !vacio ? (
          <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
            <Pencil className="size-4" />
            Editar
          </Button>
        ) : undefined
      }
    >
      {vacio ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-muted-foreground text-sm">
            Aún no se capturan sus enfermedades, alergias ni preferencias.
          </p>
          {editable && (
            <Button size="sm" onClick={() => setEditando(true)}>
              <Plus className="size-4" />
              Capturar historial
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
          {CAMPOS.map((c) => (
            <Grupo key={c.campo} {...c} items={historial![c.campo] ?? []} />
          ))}
        </div>
      )}

      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
          {editando && (
            <Editor
              pacienteId={pacienteId}
              inicial={historial ? { ...VACIO, ...pick(historial) } : VACIO}
              onCerrar={() => setEditando(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Seccion>
  );
}

function pick(h: HistorialClinico): CrearHistorialClinicoDto {
  return {
    enfermedades: h.enfermedades ?? [],
    alergias: h.alergias ?? [],
    alimentosFavoritos: h.alimentosFavoritos ?? [],
    alimentosNoFavoritos: h.alimentosNoFavoritos ?? [],
  };
}

function Grupo({
  etiqueta,
  items,
  vacio,
  tono,
  icono: Icono,
}: {
  etiqueta: string;
  items: string[];
  vacio: string;
  tono: Tono;
  icono: LucideIcon;
}) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <Icono className="size-3.5 shrink-0" aria-hidden />
        {etiqueta}
        <span className="text-muted-foreground-subtle font-normal tabular-nums">{items.length}</span>
      </p>
      {items.length === 0 ? (
        <p className="text-muted-foreground-subtle mt-2 text-xs">{vacio}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={item}
              className={cn(
                "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                CHIP[tono],
              )}
            >
              <Icono className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const iguales = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function Editor({
  pacienteId,
  inicial,
  onCerrar,
}: {
  pacienteId: Guid;
  inicial: CrearHistorialClinicoDto;
  onCerrar: () => void;
}) {
  const guardar = useGuardarHistorial(pacienteId);
  const [datos, setDatos] = useState<CrearHistorialClinicoDto>(inicial);
  const [borradores, setBorradores] = useState<Record<Campo, string>>({
    enfermedades: "",
    alergias: "",
    alimentosFavoritos: "",
    alimentosNoFavoritos: "",
  });
  const [error, setError] = useState<string | null>(null);

  const agregar = (campo: Campo, texto: string) => {
    const limpio = texto.trim().replace(/\s+/g, " ").slice(0, 100);
    if (!limpio || datos[campo].some((v) => iguales(v, limpio))) return;
    setDatos((d) => ({ ...d, [campo]: [...d[campo], limpio] }));
  };

  const quitar = (campo: Campo, valor: string) =>
    setDatos((d) => ({ ...d, [campo]: d[campo].filter((v) => v !== valor) }));

  const alTeclear = (campo: Campo, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    agregar(campo, borradores[campo]);
    setBorradores((b) => ({ ...b, [campo]: "" }));
  };

  const enviar = async () => {
    setError(null);
    /* Lo que quedo escrito sin presionar Enter tambien se guarda. */
    const final = { ...datos };
    for (const { campo } of CAMPOS) {
      const pendiente = borradores[campo].trim();
      if (pendiente && !final[campo].some((v) => iguales(v, pendiente))) final[campo] = [...final[campo], pendiente];
    }
    try {
      await guardar.mutateAsync(final);
      toast.success("Historial clínico guardado");
      onCerrar();
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  return (
    <>
      <DialogHeader icono={Stethoscope}>
        <DialogTitle>Historial clínico</DialogTitle>
        <DialogDescription>
          Escribe y presiona Enter para agregar. Las alergias se avisan al armar su plan.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {CAMPOS.map(({ campo, etiqueta, tono, icono: Icono, ejemplo, sugerencias }) => {
          const disponibles = sugerencias.filter((s) => !datos[campo].some((v) => iguales(v, s)));
          return (
            <div key={campo} className="space-y-2">
              <label htmlFor={`historial-${campo}`} className="text-foreground flex items-center gap-1.5 text-sm font-medium">
                <Icono className="text-muted-foreground size-4" aria-hidden />
                {etiqueta}
              </label>
              {datos[campo].length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {datos[campo].map((valor) => (
                    <li
                      key={valor}
                      className={cn("inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-2.5 text-sm ring-1", CHIP[tono])}
                    >
                      {valor}
                      <button
                        type="button"
                        onClick={() => quitar(campo, valor)}
                        aria-label={`Quitar ${valor}`}
                        className="hover:bg-foreground/10 grid size-5 cursor-pointer place-items-center rounded-full"
                      >
                        <X className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Input
                id={`historial-${campo}`}
                value={borradores[campo]}
                placeholder={ejemplo}
                maxLength={100}
                onChange={(e) => setBorradores((b) => ({ ...b, [campo]: e.target.value }))}
                onKeyDown={(e) => alTeclear(campo, e)}
                className="bg-card h-10"
              />
              {disponibles.length > 0 && (
                <Sugerencias etiqueta={`Sugerencias de ${etiqueta.toLowerCase()}`} opciones={disponibles} onElegir={(s) => agregar(campo, s)} />
              )}
            </div>
          );
        })}
      </div>

      {error && <AlertaFormulario>{error}</AlertaFormulario>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar} disabled={guardar.isPending}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => void enviar()} disabled={guardar.isPending}>
          {guardar.isPending && <Loader2 className="size-4 animate-spin" />}
          Guardar historial
        </Button>
      </DialogFooter>
    </>
  );
}
