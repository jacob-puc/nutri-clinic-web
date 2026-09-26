import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarPlus,
  ClipboardPlus,
  FileText,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  Ruler,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
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
import type { DocumentoPaciente, FotoSeguimiento, MedidaAntropometrica } from "@/types/api";

/**
 * Ficha del paciente. Las cuatro pestañas salen de UNA sola llamada
 * (GET /api/pacientes/{id}/expediente), asi que abrir la ficha no escala con
 * el numero de pestanas: se piden datos una vez y las tabs leen la misma
 * entrada de cache.
 */
export function PacienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: paciente, isPending: cargandoPaciente, isError: errorPaciente } =
    usePaciente(id);
  const { data: expediente, isPending: cargandoExpediente } = useExpediente(id);

  // 404 real del backend: "este paciente no existe / esta dado de baja".
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

      <EncabezadoFicha paciente={paciente} />

      <Tabs defaultValue="resumen" className="mt-6">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="medidas">Medidas</TabsTrigger>
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
            <TabResumen
              historial={historial}
              medidas={medidas}
              fotos={fotos}
              documentos={documentos}
            />
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

/* -------------------------------------------------------------------------- */
/* Encabezado                                                                  */
/* -------------------------------------------------------------------------- */

function EncabezadoFicha({ paciente }: { paciente: NonNullable<ReturnType<typeof usePaciente>["data"]> }) {
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
            <Button variant="outline" size="sm" onClick={() => avisar("Editar datos")}>
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

function Contador({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-primary/12 text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Tab: Resumen                                                                */
/* -------------------------------------------------------------------------- */

function TabResumen({
  historial,
  medidas,
  fotos,
  documentos,
}: {
  historial: ExpedienteHistorial;
  medidas: MedidaAntropometrica[];
  fotos: FotoSeguimiento[];
  documentos: DocumentoPaciente[];
}) {
  const ultima = medidas.at(-1);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
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
              <dl className="grid gap-4 sm:grid-cols-2">
                {historial.Diagnostico && (
                  <CampoHistorial etiqueta="Diagnostico" valor={historial.Diagnostico} />
                )}
                {historial.alergias && (
                  <CampoHistorial etiqueta="Alergias" valor={historial.alergias} />
                )}
                {historial.antecedentesPersonales && (
                  <CampoHistorial
                    etiqueta="Antecedentes personales"
                    valor={historial.antecedentesPersonales}
                  />
                )}
                {historial.antecedentesFamiliares && (
                  <CampoHistorial
                    etiqueta="Antecedentes familiares"
                    valor={historial.antecedentesFamiliares}
                  />
                )}
                {historial.medications && (
                  <CampoHistorial etiqueta="Medicamentos" valor={historial.medications} />
                )}
                {historial.observaciones && (
                  <CampoHistorial etiqueta="Observaciones" valor={historial.observaciones} />
                )}
              </dl>
            )}
          </CardContent>
        </Card>

        {ultima && <UltimaMedida medida={ultima} />}
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="px-4 py-5">
            <h2 className="text-foreground text-sm font-semibold">Actividad</h2>
            <Separator className="my-4" />
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Ruler className="size-3.5" aria-hidden />
                  Medidas
                </span>
                <span className="font-medium tabular-nums">{medidas.length}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="size-3.5" aria-hidden />
                  Fotos
                </span>
                <span className="font-medium tabular-nums">{fotos.length}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <FileText className="size-3.5" aria-hidden />
                  Documentos
                </span>
                <span className="font-medium tabular-nums">{documentos.length}</span>
              </li>
            </ul>

            {medidas.length > 0 && (
              <>
                <Separator className="my-4" />
                <p className="text-muted-foreground text-xs">
                  Ultima medicion: {formatearFechaHora(ultima?.fechaMedicion ?? null)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full"
          onClick={() =>
            toast.info("Registrar medida · Disponible en la siguiente iteracion")
          }
        >
          <ClipboardPlus className="size-4" />
          Registrar medida
        </Button>
      </div>
    </div>
  );
}

type ExpedienteHistorial = {
  Diagnostico: string | null;
  antecedentesFamiliares: string | null;
  antecedentesPersonales: string | null;
  medications: string | null;
  alergias: string | null;
  observaciones: string | null;
  fechaActualizacion: string | null;
} | null;

function CampoHistorial({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {etiqueta}
      </dt>
      <dd className="mt-1 text-sm">{valor}</dd>
    </div>
  );
}

function UltimaMedida({ medida }: { medida: MedidaAntropometrica }) {
  const imc = Number(medida.imc.toFixed(1));
  const categoria = categoriaImc(imc);

  return (
    <Card>
      <CardContent className="px-4 py-5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-foreground text-sm font-semibold">Ultima medicion</h2>
          <span className="text-muted-foreground text-xs">
            {formatearFechaHora(medida.fechaMedicion)}
          </span>
        </div>
        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Dato titulo="Peso" valor={`${medida.peso} kg`} />
          <Dato titulo="Estatura" valor={`${medida.estatura} m`} />
          <Dato titulo="IMC" valor={String(imc)} />
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Categoria
            </p>
            <div className="mt-1.5">
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
            </div>
          </div>
        </div>

        {medida.notasObservaciones && (
          <p className="text-muted-foreground mt-4 border-t border-border pt-3 text-sm">
            {medida.notasObservaciones}
          </p>
        )}
      </CardContent>
    </Card>
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

/* -------------------------------------------------------------------------- */
/* Tab: Medidas                                                                */
/* -------------------------------------------------------------------------- */

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
                  <th scope="col" className="text-muted-foreground hidden pb-2 text-left text-xs font-semibold tracking-wide uppercase md:table-cell">Categoria</th>
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
                      <td className="text-muted-foreground hidden py-2.5 md:table-cell">
                        {categoriaImc(imc).etiqueta}
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

/* -------------------------------------------------------------------------- */
/* Tab: Fotos                                                                  */
/* -------------------------------------------------------------------------- */

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
              <Badge variant="outline">{foto.tipo}</Badge>
              <span className="text-muted-foreground text-xs">
                {formatearFechaCorta(foto.fechaSubida)}
              </span>
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

/* -------------------------------------------------------------------------- */
/* Tab: Documentos                                                             */
/* -------------------------------------------------------------------------- */

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
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <a href={documento.urlDocumento} target="_blank" rel="noreferrer">
                Abrir
              </a>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Estados                                                                     */
/* -------------------------------------------------------------------------- */

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
