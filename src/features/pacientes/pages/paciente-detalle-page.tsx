import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarPlus,
  ClipboardPlus,
  Download,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Stethoscope,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import { DialogoPaciente } from "@/features/pacientes/components/dialogo-paciente";
import { GraficaMedidas } from "@/features/pacientes/components/grafica-medidas";
import { useExpediente, usePaciente } from "@/features/pacientes/hooks/use-expediente";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { esApiError } from "@/lib/api-error";
import {
  categoriaImc,
  etiquetaSexo,
  formatearFecha,
  formatearFechaCorta,
  formatearFechaHora,
} from "@/lib/formatters";
import type {
  DocumentoPaciente,
  FotoSeguimiento,
  HistorialClinico,
  MedidaAntropometrica,
} from "@/types/api";

export function PacienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);

  const { data: paciente, isPending: cargandoPaciente, isError: errorPaciente } =
    usePaciente(id);
  const { data: expediente, isPending: cargandoExpediente } = useExpediente(id);

  if (esApiError(errorPaciente) && errorPaciente.status === 404) {
    return <EstadoNoEncontrado nombre={paciente?.nombreCompleto} />;
  }

  if (errorPaciente) {
    return (
      <EstadoErrorGeneral
        onReintentar={() => navigate(0)}
        onVolver={() => navigate("/pacientes")}
      />
    );
  }

  if (cargandoPaciente || !paciente) {
    return <FichaSkeleton />;
  }

  const medidas = expediente?.medidasAntropometricas ?? [];
  const fotos = expediente?.fotos ?? [];
  const documentos = expediente?.documentos ?? [];
  const historial = expediente?.historialClinico ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/pacientes")}
        className="text-muted-foreground -ml-2 mb-4"
      >
        <ArrowLeft className="size-4" />
        Volver al listado
      </Button>

      <EncabezadoFicha paciente={paciente} onEditar={() => setEditando(true)} />

      <DialogoPaciente
        abierto={editando}
        onOpenChange={setEditando}
        paciente={paciente}
      />

      <Tabs defaultValue="resumen" className="mt-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="medidas">
            Medidas
            {medidas.length > 0 && <Contador>{medidas.length}</Contador>}
          </TabsTrigger>
          <TabsTrigger value="fotos">
            Fotos
            {fotos.length > 0 && (
              <Contador>{fotos.length}</Contador>
            )}
          </TabsTrigger>
          <TabsTrigger value="documentos">
            Documentos
            {documentos.length > 0 && (
              <Contador>{documentos.length}</Contador>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4">
          {cargandoExpediente ? (
            <ContenidoSkeleton />
          ) : (
            <TabResumen historial={historial} medidas={medidas} />
          )}
        </TabsContent>

        <TabsContent value="medidas" className="mt-4">
          {cargandoExpediente ? (
            <ContenidoSkeleton />
          ) : (
            <TabMedidas medidas={medidas} />
          )}
        </TabsContent>

        <TabsContent value="fotos" className="mt-4">
          {cargandoExpediente ? (
            <ContenidoSkeleton />
          ) : (
            <TabFotos fotos={fotos} />
          )}
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          {cargandoExpediente ? (
            <ContenidoSkeleton />
          ) : (
            <TabDocumentos documentos={documentos} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EncabezadoFicha({
  paciente,
  onEditar,
}: {
  paciente: NonNullable<ReturnType<typeof usePaciente>["data"]>;
  onEditar: () => void;
}) {
  const avisar = (accion: string) =>
    toast.info(`${accion} · Disponible en la siguiente iteracion`, {
      description: paciente.nombreCompleto,
    });

  return (
    <Card>
      <CardContent className="px-4 py-5 md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <AvatarPaciente
            nombre={paciente.nombreCompleto}
            id={paciente.id}
            className="size-14 text-base"
          />

          <div className="min-w-0 flex-1">
            <h1 className="text-foreground text-xl font-bold tracking-tight md:text-2xl">
              {paciente.nombreCompleto}
            </h1>
            <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span>{etiquetaSexo(paciente.sexo)}</span>
              {paciente.edad !== null && (
                <>
                  <span aria-hidden>·</span>
                  <span>{paciente.edad} anos</span>
                </>
              )}
              <span aria-hidden>·</span>
              <span>Alta {formatearFecha(paciente.fechaRegistro)}</span>
            </div>

            <dl className="mt-3 flex flex-col gap-1.5 text-sm">
              {paciente.correoElectronico && (
                <div className="flex items-center gap-2">
                  <Mail className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                  <dt className="sr-only">Correo</dt>
                  <dd className="truncate">{paciente.correoElectronico}</dd>
                </div>
              )}
              {paciente.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                  <dt className="sr-only">Telefono</dt>
                  <dd className="tabular-nums">{paciente.telefono}</dd>
                </div>
              )}
              {paciente.direccion && (
                <div className="flex items-center gap-2">
                  <MapPin className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                  <dt className="sr-only">Direccion</dt>
                  <dd className="truncate">{paciente.direccion}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={onEditar}>
              Editar
            </Button>
            <Button size="sm" onClick={() => avisar("Agendar cita")}>
              <CalendarPlus className="size-4" />
              Agendar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BotonAccion({
  icono: Icono,
  etiqueta,
  destructivo,
}: {
  icono: LucideIcon;
  etiqueta: string;
  destructivo?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled
      title={`${etiqueta} · Proximamente`}
      aria-label={etiqueta}
      className={
        destructivo
          ? "text-muted-foreground hover:text-destructive"
          : "text-muted-foreground"
      }
    >
      <Icono className="size-4" aria-hidden />
    </Button>
  );
}

function Contador({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-primary/12 text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
      {children}
    </span>
  );
}

function TabResumen({
  historial,
  medidas,
}: {
  historial: HistorialClinico | null;
  medidas: MedidaAntropometrica[];
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="px-4 py-5 md:px-6">
          <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <Stethoscope className="text-primary size-4" aria-hidden />
            Historial clinico
          </h2>
          <Separator className="my-4" />

          {!historial ? (
            <p className="text-muted-foreground text-sm">
              Sin historial registrado. Este es el estado mas comun: la mayoria
              de los pacientes aun no tienen historia clinica capturada.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-3">
              <ListaHistorial
                etiqueta="Alergias"
                items={historial.alergias}
                vacio="Sin alergias registradas"
                variante="alerta"
              />
              <ListaHistorial
                etiqueta="Alimentos favoritos"
                items={historial.alimentosFavoritos}
                vacio="Sin alimentos favoritos"
              />
              <ListaHistorial
                etiqueta="Alimentos no favoritos"
                items={historial.alimentosNoFavoritos}
                vacio="Sin alimentos no favoritos"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <UltimasMedidas medidas={medidas} />
    </div>
  );
}

function ListaHistorial({
  etiqueta,
  items,
  vacio,
  variante,
}: {
  etiqueta: string;
  items: string[];
  vacio: string;
  variante?: "alerta";
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {etiqueta}
      </p>

      {items.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-sm">{vacio}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={item}
              className={
                variante === "alerta"
                  ? "bg-destructive/10 text-destructive ring-destructive/20 rounded-full px-2 py-0.5 text-xs ring-1"
                  : "bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs"
              }
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const MAX_MEDIDAS_RESUMEN = 3;

function UltimasMedidas({ medidas }: { medidas: MedidaAntropometrica[] }) {
  if (medidas.length === 0) {
    return (
      <Card>
        <CardContent className="px-4 py-5 md:px-6">
          <EncabezadoMediciones total={0} />
          <Separator className="my-4" />
          <p className="text-muted-foreground text-sm">
            Aun no se ha registrado ninguna medida antropometrica para este
            paciente.
          </p>
        </CardContent>
      </Card>
    );
  }

  const recientes = [...medidas]
    .sort((a, b) => b.fechaMedicion.localeCompare(a.fechaMedicion))
    .slice(0, MAX_MEDIDAS_RESUMEN);

  const [principal, ...previas] = recientes;

  if (!principal) return null;

  return (
    <Card>
      <CardContent className="px-4 py-5 md:px-6">
        <EncabezadoMediciones
          total={medidas.length}
          fechaReciente={principal.fechaMedicion}
        />
        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Dato titulo="Peso" valor={`${principal.peso} kg`} />
          <Dato titulo="Estatura" valor={`${principal.estatura} m`} />
          <Dato titulo="IMC" valor={String(Number(principal.imc.toFixed(1)))} />
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Categoria
            </p>
            <div className="mt-1.5">
              <BadgeCategoria imc={principal.imc} />
            </div>
          </div>
        </div>

        {previas.length > 0 && (
          <div className="border-border mt-5 border-t pt-4">
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Anteriores mediciones
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs">
                  <th scope="col" className="pb-2 text-left font-semibold">
                    Fecha
                  </th>
                  <th scope="col" className="pb-2 text-right font-semibold">
                    Peso
                  </th>
                  <th scope="col" className="pb-2 text-right font-semibold">
                    Estatura
                  </th>
                  <th scope="col" className="pb-2 text-right font-semibold">
                    IMC
                  </th>
                  <th scope="col" className="pb-2 text-right font-semibold">
                    Variacion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {previas.map((medida, indice) => (
                  <tr key={medida.id}>
                    <td className="py-2.5">
                      {formatearFechaCorta(medida.fechaMedicion)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {medida.peso} kg
                    </td>
                    <td className="text-muted-foreground py-2.5 text-right tabular-nums">
                      {medida.estatura} m
                    </td>
                    <td className="py-2.5 text-right font-medium tabular-nums">
                      {Number(medida.imc.toFixed(1))}
                    </td>
                    <td className="py-2.5 text-right">
                      <VariacionPeso
                        delta={
                          recientes[indice]
                            ? medida.peso - recientes[indice].peso
                            : 0
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Cambio de peso contra la medida siguiente. En nutricion clinica perder peso
 * suele ser el objetivo, asi que la bajada se lee como avance y la subida
 * como algo a revisar.
 */
function VariacionPeso({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.05) {
    return <span className="text-muted-foreground">sin cambio</span>;
  }

  const subio = delta > 0;
  const Icono = subio ? TrendingUp : TrendingDown;

  return (
    <span
      className={
        subio
          ? "text-warning inline-flex items-center justify-end gap-1 font-medium tabular-nums"
          : "text-primary inline-flex items-center justify-end gap-1 font-medium tabular-nums"
      }
    >
      <Icono className="size-3.5" aria-hidden />
      {Math.abs(delta).toFixed(1)} kg
    </span>
  );
}

function EncabezadoMediciones({
  total,
  fechaReciente,
}: {
  total: number;
  fechaReciente?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="text-foreground text-sm font-semibold">
          {total === 1 ? "Ultima medicion" : "Ultimas mediciones"}
        </h2>
        {total > 0 && (
          <span className="text-muted-foreground text-xs">
            {total} {total === 1 ? "registrada" : "registradas"}
            {fechaReciente && ` · ${formatearFechaCorta(fechaReciente)}`}
          </span>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          toast.info("Registrar medida · Disponible en la siguiente iteracion")
        }
      >
        <ClipboardPlus className="size-4" />
        Registrar medida
      </Button>
    </div>
  );
}

function BadgeCategoria({ imc }: { imc: number }) {
  const categoria = categoriaImc(Number(imc.toFixed(1)));

  return (
    <Badge
      variant="outline"
      className={
        categoria.tono === "destructive"
          ? "border-destructive/40 text-destructive"
          : categoria.tono === "warning"
            ? "border-warning/40 text-warning"
            : categoria.tono === "success"
              ? "border-success/40 text-success"
              : "border-info/40 text-info"
      }
    >
      {categoria.etiqueta}
    </Badge>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {titulo}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{valor}</p>
    </div>
  );
}

function TabMedidas({ medidas }: { medidas: MedidaAntropometrica[] }) {
  if (medidas.length === 0) {
    return <Vacio titulo="Sin mediciones" descripcion="Aun no se ha registrado ninguna medida antropometrica para este paciente." />;
  }

  const ordenadas = [...medidas].sort((a, b) =>
    b.fechaMedicion.localeCompare(a.fechaMedicion),
  );

  return (
    <div className="space-y-4">
      <GraficaMedidas medidas={medidas} />

      <Card>
        <CardContent className="px-4 py-5 md:px-6">
          <h2 className="text-foreground mb-4 text-sm font-semibold">
            Todas las mediciones
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Mediciones antropometricas del paciente</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="text-muted-foreground pb-2 text-left text-xs font-semibold tracking-wide uppercase">Fecha</th>
                  <th scope="col" className="text-muted-foreground pb-2 text-right text-xs font-semibold tracking-wide uppercase">Peso</th>
                  <th scope="col" className="text-muted-foreground hidden pb-2 text-right text-xs font-semibold tracking-wide uppercase sm:table-cell">Estatura</th>
                  <th scope="col" className="text-muted-foreground pb-2 text-right text-xs font-semibold tracking-wide uppercase">IMC</th>
                  <th scope="col" className="text-muted-foreground hidden pb-2 pl-4 text-left text-xs font-semibold tracking-wide uppercase md:table-cell">Categoria</th>
                  <th scope="col" className="text-muted-foreground hidden pb-2 pl-6 text-left text-xs font-semibold tracking-wide uppercase lg:table-cell">Observaciones</th>
                  <th scope="col" className="text-muted-foreground pb-2 pl-4 text-right text-xs font-semibold tracking-wide uppercase">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ordenadas.map((medida) => {
                  const imc = Number(medida.imc.toFixed(1));
                  return (
                    <tr key={medida.id} className="hover:bg-accent transition-colors">
                      <td className="py-2.5 whitespace-nowrap">
                        {formatearFechaHora(medida.fechaMedicion)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{medida.peso} kg</td>
                      <td className="text-muted-foreground hidden py-2.5 text-right tabular-nums sm:table-cell">
                        {medida.estatura} m
                      </td>
                      <td className="py-2.5 text-right font-medium tabular-nums">{imc}</td>
                      <td className="text-muted-foreground hidden py-2.5 pl-4 md:table-cell">
                        {categoriaImc(imc).etiqueta}
                      </td>
                      <td
                        className="text-muted-foreground hidden truncate py-2.5 pl-6 lg:table-cell"
                        title={medida.notasObservaciones ?? undefined}
                      >
                        {medida.notasObservaciones ?? "—"}
                      </td>
                      <td className="py-2.5 pl-4">
                        <div className="flex items-center justify-end gap-1">
                          <BotonAccion icono={Pencil} etiqueta="Editar medida" />
                          <BotonAccion
                            icono={Trash2}
                            etiqueta="Eliminar medida"
                            destructivo
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TabFotos({ fotos }: { fotos: FotoSeguimiento[] }) {
  if (fotos.length === 0) {
    return <Vacio titulo="Sin fotos" descripcion="No hay fotos de seguimiento registradas para este paciente." />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {fotos.map((foto) => (
        <Card key={foto.id} className="overflow-hidden">
          <div className="bg-muted aspect-4/3 w-full overflow-hidden">
            <img
              src={foto.urlFoto}
              alt={foto.notas ?? `Foto de seguimiento (${foto.tipo})`}
              loading="lazy"
              className="size-full object-cover"
            />
          </div>
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{foto.tipo}</Badge>
                <span className="text-muted-foreground text-xs">
                  {formatearFechaCorta(foto.fechaSubida)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <BotonAccion icono={Download} etiqueta="Descargar foto" />
                <BotonAccion
                  icono={Trash2}
                  etiqueta="Eliminar foto"
                  destructivo
                />
              </div>
            </div>
            {foto.notas && (
              <p className="text-muted-foreground mt-2 text-sm">{foto.notas}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TabDocumentos({ documentos }: { documentos: DocumentoPaciente[] }) {
  if (documentos.length === 0) {
    return <Vacio titulo="Sin documentos" descripcion="No hay analisis, estudios ni recetas associated a este paciente." />;
  }

  return (
    <Card>
      <CardContent className="divide-y divide-border px-0 py-0">
        {documentos.map((documento) => (
          <div
            key={documento.id}
            className="hover:bg-accent flex items-start gap-3 px-4 py-4 transition-colors md:px-6"
          >
            <div className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
              <FileText className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate font-medium">
                {documento.nombreDocumento}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {documento.tipo} · {formatearFechaCorta(documento.fechaSubida)}
              </p>
              {documento.observaciones && (
                <p className="mt-1.5 text-sm">{documento.observaciones}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <BotonAccion icono={Pencil} etiqueta="Editar documento" />
              <BotonAccion
                icono={Trash2}
                etiqueta="Eliminar documento"
                destructivo
              />
              <Button variant="ghost" size="sm" asChild>
                <a href={documento.urlDocumento} target="_blank" rel="noreferrer">
                  Abrir
                </a>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Vacio({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div className="bg-muted text-muted-foreground grid size-14 place-items-center rounded-full">
          <ClipboardPlus className="size-6" aria-hidden />
        </div>
        <div>
          <h2 className="text-foreground font-semibold">{titulo}</h2>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
            {descripcion}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function EstadoNoEncontrado({ nombre }: { nombre?: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center md:px-8">
      <Card>
        <CardContent className="px-6 py-14">
          <h1 className="text-foreground text-xl font-bold">
            Paciente no encontrado
          </h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
            {nombre
              ? `El paciente ${nombre} ya no esta activo en la clinica.`
              : "El paciente que buscas no existe o fue dado de baja."}
          </p>
          <Button asChild className="mt-6">
            <Link to="/pacientes">Volver al listado</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function EstadoErrorGeneral({
  onReintentar,
  onVolver,
}: {
  onReintentar: () => void;
  onVolver: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 md:px-8">
      <Card className="border-destructive/40">
        <CardContent className="px-6 py-14 text-center">
          <h1 className="text-foreground text-xl font-bold">
            No pudimos cargar la ficha
          </h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
            Revisa que la API este corriendo y vuelve a intentarlo.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={onVolver}>
              Volver al listado
            </Button>
            <Button onClick={onReintentar}>Reintentar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContenidoSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardContent className="space-y-3 px-4 py-5 md:px-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="space-y-3 px-4 py-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}

function FichaSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <Skeleton className="h-8 w-36" />
      <Card className="mt-4">
        <CardContent className="flex gap-4 px-4 py-5 md:px-6">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
        </CardContent>
      </Card>
      <div className="mt-6">
        <ContenidoSkeleton />
      </div>
    </div>
  );
}
