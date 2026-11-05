import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Apple, ImagePlus, Loader2, Plus, Scale, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertaFormulario } from "@/components/ui/grupo-campos";
import { Input } from "@/components/ui/input";
import { InputUnidad } from "@/components/ui/input-unidad";
import { ImagenAlimento } from "@/features/menus/components/imagen-alimento";
import { useActualizarAlimento, useCrearAlimento, useSubirImagenAlimento } from "@/features/menus/hooks/use-menus";
import { formatearKcal, LIMITES, nuevaClave } from "@/features/menus/lib/menus";
import { MEDIDAS_SUGERIDAS } from "@/features/menus/lib/medidas";
import { mensajeDeError } from "@/lib/api-error";
import { campoNumero } from "@/lib/campos-formulario";
import type { Alimento } from "@/types/api";

const gramos = (nombre: string) =>
  z
    .number({ required_error: `Indica ${nombre}.`, invalid_type_error: `Indica ${nombre}.` })
    .min(0, "No puede ser negativo.")
    .max(LIMITES.gramosPor100g, `No puede superar ${LIMITES.gramosPor100g} g en 100 g.`);

const schema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(150, "Máximo 150 caracteres."),
  calorias: z
    .number({ required_error: "Indica las calorías.", invalid_type_error: "Indica las calorías." })
    .min(0, "No puede ser negativo.")
    .max(LIMITES.caloriasPor100g, `No puede superar ${LIMITES.caloriasPor100g} kcal.`),
  proteinas: gramos("las proteínas"),
  carbohidratos: gramos("los carbohidratos"),
  grasas: gramos("las grasas"),
});

type Valores = z.infer<typeof schema>;

export function DialogoAlimento({
  abierto,
  onOpenChange,
  alimento,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  /** Sin alimento el dialogo da de alta uno nuevo. */
  alimento?: Alimento | null;
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {/* El contenido se monta al abrir: cada apertura parte de los datos
            vigentes sin tener que resetear el formulario a mano. */}
        {abierto && <Contenido alimento={alimento ?? null} onCerrar={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({ alimento, onCerrar }: { alimento: Alimento | null; onCerrar: () => void }) {
  const crear = useCrearAlimento();
  const actualizar = useActualizarAlimento();
  const subirImagen = useSubirImagenAlimento();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  /* Foto: la nueva se sube despues de guardar, porque al crear el alimento
     todavia no tiene id. "Quitar" deja la URL en null con el mismo PUT. */
  const [imagenNueva, setImagenNueva] = useState<File | null>(null);
  const [quitarImagen, setQuitarImagen] = useState(false);
  const [errorImagen, setErrorImagen] = useState<string | null>(null);
  const vistaPrevia = useVistaPrevia(imagenNueva);
  const urlVisible = vistaPrevia ?? (quitarImagen ? null : alimento?.imagenUrl);

  const elegirImagen = (archivo: File | undefined) => {
    setErrorImagen(null);
    if (!archivo) return;
    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      setErrorImagen("Solo JPEG, PNG o WEBP.");
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      setErrorImagen("La imagen no puede superar 5 MB.");
      return;
    }
    setImagenNueva(archivo);
    setQuitarImagen(false);
  };

  /* Medidas caseras: opcionales, los gramos siguen siendo la base. */
  const [medidas, setMedidas] = useState<FilaMedida[]>(() =>
    (alimento?.medidas ?? []).map((m) => ({ clave: nuevaClave(), nombre: m.nombre, gramos: m.gramos })),
  );
  const [errorMedidas, setErrorMedidas] = useState<string | null>(null);

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: alimento
      ? {
          nombre: alimento.nombre,
          calorias: alimento.calorias,
          proteinas: alimento.proteinas,
          carbohidratos: alimento.carbohidratos,
          grasas: alimento.grasas,
        }
      : { nombre: "" },
  });

  const [proteinas, carbohidratos, grasas, calorias] = useWatch({
    control: form.control,
    name: ["proteinas", "carbohidratos", "grasas", "calorias"],
  });
  const estimadas = (proteinas ?? 0) * 4 + (carbohidratos ?? 0) * 4 + (grasas ?? 0) * 9;
  /* Aviso, no error: la fibra y el alcohol tambien aportan energia. */
  const descuadre =
    calorias !== undefined && estimadas > 0 && Math.abs(calorias - estimadas) / estimadas > 0.2;

  const guardando = crear.isPending || actualizar.isPending || subirImagen.isPending;

  const enviar = form.handleSubmit(async (valores) => {
    setErrorGeneral(null);
    const problema = problemaMedidas(medidas);
    setErrorMedidas(problema);
    if (problema) return;

    const dto = {
      ...valores,
      nombre: valores.nombre.trim(),
      imagenUrl: quitarImagen ? null : (alimento?.imagenUrl ?? null),
      medidas: medidas.map((m) => ({ nombre: m.nombre.trim().toLowerCase(), gramos: m.gramos as number })),
    };
    try {
      let alimentoId: string;
      if (alimento) {
        await actualizar.mutateAsync({ alimentoId: alimento.id, dto });
        alimentoId = alimento.id;
      } else {
        alimentoId = (await crear.mutateAsync(dto)).id;
      }

      if (imagenNueva) {
        try {
          await subirImagen.mutateAsync({ alimentoId, imagen: imagenNueva });
        } catch (error) {
          /* Los datos ya se guardaron: solo fallo la foto, se avisa sin perderlos. */
          toast.warning("El alimento se guardó, pero la foto no se pudo subir", {
            description: mensajeDeError(error),
          });
          onCerrar();
          return;
        }
      }

      toast.success(alimento ? "Alimento actualizado" : "Alimento agregado al catálogo", {
        description: dto.nombre,
      });
      onCerrar();
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    }
  });

  return (
    <>
      <DialogHeader icono={Apple}>
        <DialogTitle>{alimento ? "Editar alimento" : "Nuevo alimento"}</DialogTitle>
        <DialogDescription>
          Valores nutricionales por cada 100 g. Los platos calculan sus macros a partir de aquí.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={enviar} noValidate className="space-y-5">
          <div className="flex items-start gap-4">
            <SelectorFoto
              url={urlVisible}
              nombre={form.getValues("nombre") || "Alimento"}
              onElegir={elegirImagen}
              onQuitar={() => {
                setImagenNueva(null);
                setQuitarImagen(true);
                setErrorImagen(null);
              }}
            />
            <div className="min-w-0 flex-1">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Pechuga de pollo" maxLength={150} className="bg-card h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className={errorImagen ? "text-destructive mt-2 text-xs" : "text-muted-foreground-subtle mt-2 text-xs"}>
                {errorImagen ?? "Foto opcional · JPEG, PNG o WEBP, hasta 5 MB. Ayuda a reconocerlo al armar platos."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="calorias"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Energía</FormLabel>
                  <FormControl>
                    <InputUnidad unidad="kcal" inputMode="decimal" step="0.1" placeholder="165" {...campoNumero(field)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(
              [
                ["proteinas", "Proteínas", "31"],
                ["carbohidratos", "Carbohidratos", "0"],
                ["grasas", "Grasas", "3.6"],
              ] as const
            ).map(([nombre, etiqueta, ejemplo]) => (
              <FormField
                key={nombre}
                control={form.control}
                name={nombre}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{etiqueta}</FormLabel>
                    <FormControl>
                      <InputUnidad unidad="g" inputMode="decimal" step="0.1" placeholder={ejemplo} {...campoNumero(field)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          {estimadas > 0 && (
            <p className={descuadre ? "text-warning-soft-foreground text-xs" : "text-muted-foreground text-xs"}>
              Según los macros serían unas {formatearKcal(estimadas)}.
              {descuadre && " Revisa la captura: la diferencia supera el 20 %."}
            </p>
          )}

          <EditorMedidas medidas={medidas} onChange={setMedidas} error={errorMedidas} />

          {errorGeneral && <AlertaFormulario>{errorGeneral}</AlertaFormulario>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando && <Loader2 className="size-4 animate-spin" />}
              {alimento ? "Guardar cambios" : "Agregar alimento"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

interface FilaMedida {
  clave: string;
  nombre: string;
  gramos: number | undefined;
}

const MAXIMO_MEDIDAS = 8;

function problemaMedidas(medidas: FilaMedida[]): string | null {
  if (medidas.some((m) => m.nombre.trim() === "")) return "Ponle nombre a cada medida.";
  if (medidas.some((m) => !m.gramos || m.gramos <= 0)) return "Indica cuántos gramos pesa cada medida.";
  if (medidas.some((m) => (m.gramos ?? 0) > LIMITES.racionGramos))
    return `Una medida no puede superar ${LIMITES.racionGramos} g.`;
  const nombres = medidas.map((m) => m.nombre.trim().toLowerCase());
  if (new Set(nombres).size !== nombres.length) return "Hay dos medidas con el mismo nombre.";
  return null;
}

/** Equivalencias del alimento: "pieza" = 50 g. Se ofrecen al armar platos, junto a los gramos. */
function EditorMedidas({
  medidas,
  onChange,
  error,
}: {
  medidas: FilaMedida[];
  onChange: (medidas: FilaMedida[]) => void;
  error: string | null;
}) {
  const cambiar = (clave: string, cambios: Partial<FilaMedida>) =>
    onChange(medidas.map((m) => (m.clave === clave ? { ...m, ...cambios } : m)));
  const agregar = (nombre: string) =>
    onChange([...medidas, { clave: nuevaClave(), nombre, gramos: undefined }]);
  const usadas = new Set(medidas.map((m) => m.nombre.trim().toLowerCase()));
  const sugeridas = MEDIDAS_SUGERIDAS.filter((s) => !usadas.has(s));
  const lleno = medidas.length >= MAXIMO_MEDIDAS;

  return (
    <fieldset className="border-border-strong space-y-2.5 border-t border-dashed pt-4">
      <legend className="sr-only">Medidas caseras</legend>
      <div>
        <p className="text-foreground flex items-center gap-1.5 text-sm font-medium">
          <Scale className="text-muted-foreground size-4" aria-hidden />
          Medidas caseras
          <span className="text-muted-foreground-subtle text-xs font-normal">(opcional)</span>
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Permiten capturar “2 piezas” en lugar de gramos. Indica cuánto pesa cada una.
        </p>
      </div>

      {medidas.map((medida) => (
        <div key={medida.clave} className="grid grid-cols-[minmax(0,1fr)_7rem_auto] items-center gap-2">
          <Input
            aria-label="Nombre de la medida"
            value={medida.nombre}
            maxLength={40}
            placeholder="pieza"
            onChange={(e) => cambiar(medida.clave, { nombre: e.target.value })}
            className="bg-card h-9"
          />
          <InputUnidad
            unidad="g"
            inputMode="decimal"
            min={1}
            step="1"
            aria-label={`Gramos de una ${medida.nombre || "medida"}`}
            value={medida.gramos ?? ""}
            onChange={(e) =>
              cambiar(medida.clave, { gramos: e.target.value === "" ? undefined : Number(e.target.value) })
            }
            className="h-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Quitar ${medida.nombre || "medida"}`}
            onClick={() => onChange(medidas.filter((m) => m.clave !== medida.clave))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}

      {!lleno && (
        <div className="flex flex-wrap gap-1.5">
          {sugeridas.map((nombre) => (
            <button
              key={nombre}
              type="button"
              onClick={() => agregar(nombre)}
              className="border-border text-muted-foreground hover:border-primary/50 hover:text-foreground flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
            >
              <Plus className="size-3" aria-hidden />
              {nombre}
            </button>
          ))}
          <button
            type="button"
            onClick={() => agregar("")}
            className="text-primary rounded-full px-2 py-1 text-xs font-semibold hover:underline"
          >
            Otra medida
          </button>
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
    </fieldset>
  );
}

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO = 5 * 1024 * 1024;

/** Lee el archivo elegido como data URL para verlo antes de subirlo. */
function useVistaPrevia(archivo: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => setUrl(typeof lector.result === "string" ? lector.result : null);
    lector.readAsDataURL(archivo);
    return () => lector.abort();
  }, [archivo]);
  return archivo ? url : null;
}

/**
 * Cuadro de foto: clic (o soltar un archivo) para elegirla; con foto, un
 * boton pequeño para quitarla. El input de archivo real queda debajo, asi
 * en el celular abre la camara.
 */
function SelectorFoto({
  url,
  nombre,
  onElegir,
  onQuitar,
}: {
  url: string | null | undefined;
  nombre: string;
  onElegir: (archivo: File | undefined) => void;
  onQuitar: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="group relative shrink-0">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          onElegir(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onElegir(e.dataTransfer.files?.[0]);
        }}
        aria-label={url ? "Cambiar foto" : "Agregar foto"}
        className="border-muted-foreground/40 hover:border-primary/60 relative grid size-20 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
      >
        {url ? (
          <ImagenAlimento url={url} nombre={nombre} className="size-full rounded-none" />
        ) : (
          <span className="text-muted-foreground flex flex-col items-center gap-1 text-[11px]">
            <ImagePlus className="size-5" aria-hidden />
            Foto
          </span>
        )}
      </button>
      {url && (
        <button
          type="button"
          onClick={onQuitar}
          aria-label="Quitar foto"
          className="bg-card/95 text-muted-foreground hover:text-destructive absolute -top-2 -right-2 grid size-6 cursor-pointer place-items-center rounded-full border shadow-sm"
        >
          <Trash2 className="size-3" aria-hidden />
        </button>
      )}
    </div>
  );
}
