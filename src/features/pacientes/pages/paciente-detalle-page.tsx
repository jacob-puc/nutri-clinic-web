import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Ban,
  CalendarPlus,
  ClipboardPlus,
  Contact,
  FileText,
  Heart,
  Ruler,
  Scale,
  Stethoscope,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import { CitasPaciente } from "@/features/citas/components/citas-paciente";
import { DialogoCita } from "@/features/citas/components/dialogo-cita";
import { DialogoMedida } from "@/features/pacientes/components/dialogo-medida";
import { LineaObjetivo } from "@/features/pacientes/components/linea-objetivo";
import { DialogoPaciente } from "@/features/pacientes/components/dialogo-paciente";
import { GraficaMedidas } from "@/features/pacientes/components/grafica-medidas";
import { useExpediente, usePaciente } from "@/features/pacientes/hooks/use-expediente";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EstadoError } from "@/components/states/estado-error";
import { EstadoVacio } from "@/components/states/estado-vacio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { esApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import {
  categoriaImc,
  etiquetaSexo,
  formatearFecha,
  formatearFechaCorta,
  formatearEstatura,
  formatearFechaHora,
} from "@/lib/formatters";
import type {
  DocumentoPaciente,
  FotoSeguimiento,
  HistorialClinico,
  MedidaAntropometrica,
  Paciente,
  TipoFoto,
} from "@/types/api";

export function PacienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [registrandoMedida, setRegistrandoMedida] = useState(false);
  const [agendandoCita, setAgendandoCita] = useState(false);

  const { data: paciente, isPending: cargandoPaciente, isError: errorPaciente } =
    usePaciente(id);
  const { data: expediente, isPending: cargandoExpediente } = useExpediente(id);

  if (esApiError(errorPaciente) && errorPaciente.status === 404) {
    return (
      <EstadoError
        variante="pagina"
        /* Un 404 es informativo, no una falla: se neutraliza el borde
           destructivo por defecto. */
        className="border-border"
        titulo="Paciente no encontrado"
        mensaje={
          paciente?.nombreCompleto
            ? `El paciente ${paciente.nombreCompleto} ya no está activo en la clínica.`
            : "El paciente que buscas no existe o fue dado de baja."
        }
      >
        <Button asChild>
          <Link to="/pacientes">Volver a pacientes</Link>
        </Button>
      </EstadoError>
    );
  }

  if (errorPaciente) {
    return (
      <EstadoError
        variante="pagina"
        titulo="No pudimos cargar la ficha"
        mensaje="Revisa que la API esté corriendo y vuelve a intentarlo."
        onReintentar={() => navigate(0)}
      >
        <Button variant="outline" onClick={() => navigate("/pacientes")}>
          Volver a pacientes
        </Button>
      </EstadoError>
    );
  }

  if (cargandoPaciente || !paciente) {
    return <FichaSkeleton />;
  }

  const medidas = expediente?.medidasAntropometricas ?? [];
  const fotos = expediente?.fotos ?? [];
  const documentos = expediente?.documentos ?? [];
  const historial = expediente?.historialClinico ?? null;
  const estaturaUltima = [...medidas]
    .sort((a, b) => b.fechaMedicion.localeCompare(a.fechaMedicion))[0]?.estatura;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <Breadcrumbs
        etiquetaNav="Navegación del expediente"
        className="mb-4"
        tramos={[
          { etiqueta: "Pacientes", href: "/pacientes" },
          { etiqueta: "Expediente clínico" },
        ]}
      />

      <EncabezadoFicha
        paciente={paciente}
        medidas={medidas}
        onEditar={() => setEditando(true)}
        onRegistrarMedida={() => setRegistrandoMedida(true)}
        onAgendarCita={() => setAgendandoCita(true)}
      />

      <DialogoPaciente
        abierto={editando}
        onOpenChange={setEditando}
        paciente={paciente}
      />

      <DialogoCita
        abierto={agendandoCita}
        onOpenChange={setAgendandoCita}
        pacienteId={paciente.id}
        pacienteNombre={paciente.nombreCompleto}
      />

      {id && (
        <DialogoMedida
          abierto={registrandoMedida}
          onOpenChange={setRegistrandoMedida}
          pacienteId={id}
          estaturaSugerida={estaturaUltima}
        />
      )}

      <Tabs defaultValue="resumen" className="mt-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="medidas">
            Evolución
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
            <TabResumen
              historial={historial}
              medidas={medidas}
              paciente={paciente}
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

function EncabezadoFicha({
  paciente,
  medidas,
  onEditar,
  onRegistrarMedida,
  onAgendarCita,
}: {
  paciente: NonNullable<ReturnType<typeof usePaciente>["data"]>;
  medidas: MedidaAntropometrica[];
  onEditar: () => void;
  onRegistrarMedida: () => void;
  onAgendarCita: () => void;
}) {
  const porFecha = [...medidas].sort((a, b) =>
    b.fechaMedicion.localeCompare(a.fechaMedicion),
  );
  const ultimaMedida = porFecha[0];
  const imcActual = ultimaMedida
    ? Number(ultimaMedida.imc.toFixed(1))
    : null;
  const categoria = imcActual !== null ? categoriaImc(imcActual) : null;

  return (
    <section className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
      {/* Folio del expediente + acciones: portada de la ficha, no una card mas. */}
      <div className="border-border/70 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 md:px-6">
        <div className="flex items-center gap-2.5">
          <span className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">
            Expediente clínico
          </span>
          <span aria-hidden className="bg-border h-3 w-px" />
          <span className="text-muted-foreground-subtle text-[11px] tracking-wide tabular-nums">
            EXP-{paciente.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEditar}>
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={onAgendarCita}>
            <CalendarPlus className="size-4" />
            <span className="hidden sm:inline">Agendar cita</span>
            <span className="sm:hidden">Cita</span>
          </Button>
          <Button size="sm" onClick={onRegistrarMedida}>
            <ClipboardPlus className="size-4" />
            Nueva medición
          </Button>
        </div>
      </div>

      <div className="grid gap-5 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8">
        <div className="flex min-w-0 items-start gap-4">
          <AvatarPaciente
            nombre={paciente.nombreCompleto}
            id={paciente.id}
            className="size-14 shrink-0 text-base"
          />

          <div className="min-w-0">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
              {paciente.nombreCompleto}
            </h1>

            <p className="text-muted-foreground mt-1 text-sm tabular-nums">
              {paciente.edad !== null && <>{paciente.edad} años · </>}
              Tel: {paciente.telefono}
            </p>

            <LineaObjetivo
              paciente={paciente}
              medidas={medidas}
              className="mt-3 max-w-sm"
            />
          </div>
        </div>

        {/* Constantes actuales: numeros grandes y etiquetas micro, como una hoja de signos. */}
        <div className="lg:border-border/70 lg:border-l lg:pl-8">
          <dl className="border-border/60 grid grid-cols-3 gap-4 border-t pt-4 lg:border-t-0 lg:pt-0">
            <Constante
              etiqueta="Peso"
              valor={ultimaMedida ? `${ultimaMedida.peso}` : "—"}
              unidad="kg"
              icono={Scale}
            />
            <Constante
              etiqueta="IMC"
              valor={imcActual !== null ? `${imcActual}` : "—"}
              icono={Activity}
              tono={categoria?.tono}
            />
            <Constante
              etiqueta="Estatura"
              valor={ultimaMedida?.estatura != null ? `${ultimaMedida.estatura}` : "—"}
              unidad="cm"
              icono={Ruler}
            />
          </dl>

          {categoria && imcActual !== null && (
            <div className="border-border/60 mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
                Categoría OMS
              </span>
              <BadgeCategoria imc={imcActual} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type TonoImc = "success" | "info" | "warning" | "destructive";

function Constante({
  etiqueta,
  valor,
  unidad,
  tono,
  icono: Icono,
}: {
  etiqueta: string;
  valor: string;
  unidad?: string;
  tono?: TonoImc;
  icono: LucideIcon;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase">
        <Icono className="size-3.5 shrink-0" aria-hidden />
        {etiqueta}
      </dt>
      <dd
        className={cn(
          "mt-1 flex items-baseline gap-1 text-2xl font-semibold tracking-tight tabular-nums",
          tono === "destructive"
            ? "text-destructive"
            : tono === "warning"
              ? "text-warning"
              : tono === "success"
                ? "text-success"
                : "text-foreground",
        )}
      >
        {valor}
        {unidad && (
          <span className="text-muted-foreground text-xs font-medium tracking-normal">
            {unidad}
          </span>
        )}
      </dd>
    </div>
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
  paciente,
}: {
  historial: HistorialClinico | null;
  medidas: MedidaAntropometrica[];
  paciente: Paciente;
}) {
  return (
    <div className="space-y-4">
      <PanelFicha paciente={paciente} />

      <CitasPaciente
        pacienteId={paciente.id}
        pacienteNombre={paciente.nombreCompleto}
      />

      <PanelHistorial historial={historial} />

      <PanelMediciones medidas={medidas} pesoObjetivo={paciente.pesoObjetivo} />
    </div>
  );
}

/** Cabecera comun de cada seccion del expediente: icono, titulo y meta. */
function Panel({
  titulo,
  icono: Icono,
  meta,
  acciones,
  children,
}: {
  titulo: string;
  icono: LucideIcon;
  meta?: React.ReactNode;
  acciones?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
      <header className="border-border/70 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 md:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Icono className="text-primary size-4 shrink-0" aria-hidden />
          <h2 className="text-foreground text-sm font-semibold tracking-tight">
            {titulo}
          </h2>
          {meta && (
            <span className="text-muted-foreground-subtle truncate text-xs">
              {meta}
            </span>
          )}
        </div>
        {acciones}
      </header>
      <div className="px-4 py-4 md:px-5">{children}</div>
    </section>
  );
}

function PanelFicha({ paciente }: { paciente: Paciente }) {
  return (
    <Panel
      titulo="Ficha del paciente"
      icono={Contact}
      meta="Datos de contacto y alta"
    >
      <dl className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        <DatoFicha etiqueta="Sexo" valor={etiquetaSexo(paciente.sexo)} />
        <DatoFicha
          etiqueta="Fecha de nacimiento"
          valor={
            paciente.fechaNacimiento
              ? formatearFecha(paciente.fechaNacimiento)
              : null
          }
        />
        <DatoFicha
          etiqueta="Correo electrónico"
          valor={paciente.correoElectronico}
        />
        <DatoFicha etiqueta="Teléfono" valor={paciente.telefono} />
        <DatoFicha etiqueta="Direccion" valor={paciente.direccion} />
        <DatoFicha
          etiqueta="Fecha de alta"
          valor={formatearFecha(paciente.fechaRegistro)}
        />
      </dl>
    </Panel>
  );
}

function DatoFicha({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string | null;
}) {
  return (
    <div className="border-border/50 py-2.5">
      <dt className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
        {etiqueta}
      </dt>
      <dd className="text-foreground mt-1 text-sm break-words">
        {valor ?? <span className="text-muted-foreground-subtle">Sin registro</span>}
      </dd>
    </div>
  );
}

function PanelHistorial({ historial }: { historial: HistorialClinico | null }) {
  return (
    <Panel
      titulo="Historial clínico"
      icono={Stethoscope}
      meta="Alergias y preferencias de la dieta"
    >
      {!historial ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          Sin historial clínico capturado. Complétalo en la primera consulta.
        </p>
      ) : (
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
          <GrupoHistorial
            etiqueta="Alergias"
            items={historial.alergias}
            vacio="Sin alergias registradas"
            tono="alerta"
            icono={AlertTriangle}
          />
          <GrupoHistorial
            etiqueta="Alimentos favoritos"
            items={historial.alimentosFavoritos}
            vacio="Sin alimentos favoritos"
            tono="favorito"
            icono={Heart}
          />
          <GrupoHistorial
            etiqueta="Alimentos no favoritos"
            items={historial.alimentosNoFavoritos}
            vacio="Sin alimentos no favoritos"
            tono="evitar"
            icono={Ban}
          />
        </div>
      )}
    </Panel>
  );
}

type TonoHistorial = "alerta" | "favorito" | "evitar";

/** Cada tipo de alimento se distingue por icono y tono, no solo por el texto. */
const CHIP_HISTORIAL: Record<TonoHistorial, string> = {
  alerta: "bg-destructive-soft text-destructive-soft-foreground ring-destructive/30",
  favorito: "bg-success-soft text-success-soft-foreground ring-success/30",
  evitar: "bg-secondary text-secondary-foreground ring-ring/40",
};

function GrupoHistorial({
  etiqueta,
  items,
  vacio,
  tono,
  icono: Icono,
}: {
  etiqueta: string;
  items: string[];
  vacio: string;
  tono: TonoHistorial;
  icono: LucideIcon;
}) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase">
        <Icono className="size-3.5 shrink-0" aria-hidden />
        {etiqueta}
        <span className="text-muted-foreground-subtle font-normal tabular-nums">
          {items.length}
        </span>
      </p>

      {items.length === 0 ? (
        <p className="border-border/60 text-muted-foreground-subtle mt-2 rounded-md border border-dashed px-3 py-2 text-xs">
          {vacio}
        </p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={item}
              className={cn(
                "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                CHIP_HISTORIAL[tono],
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

const MAX_MEDIDAS_RESUMEN = 3;

/** En la barra de variacion, 5 kg llegan al tope: el centro es el punto de partida. */
const ESCALA_BARRA_KG = 5;

function PanelMediciones({
  medidas,
  pesoObjetivo,
}: {
  medidas: MedidaAntropometrica[];
  pesoObjetivo: number | null;
}) {
  if (medidas.length === 0) {
    return (
      <Panel titulo="Mediciones" icono={ClipboardPlus}>
        <p className="text-muted-foreground py-6 text-center text-sm">
          Aun no se ha registrado ninguna medida antropometrica para este
          paciente.
        </p>
      </Panel>
    );
  }

  const ascendente = [...medidas].sort((a, b) =>
    a.fechaMedicion.localeCompare(b.fechaMedicion),
  );
  const principal = ascendente.at(-1);
  const anterior = ascendente.at(-2);
  if (!principal) return null;

  // La primera medicion jamas registrada no tiene contra que compararse.
  const sinPrecedente = new Set([ascendente[0]?.id]);
  const recientes = [...ascendente].reverse().slice(0, MAX_MEDIDAS_RESUMEN);
  const previas = recientes.slice(1);
  const imcActual = Number(principal.imc.toFixed(1));

  return (
    <Panel
      titulo="Mediciones"
      icono={ClipboardPlus}
      meta={`${medidas.length} ${
        medidas.length === 1 ? "registrada" : "registradas"
      } · última ${formatearFechaCorta(principal.fechaMedicion)}`}
    >
      {/* Hoja de signos: cifras actuales con su variacion respecto a lo anterior. */}
      <dl className="border-border/60 grid grid-cols-2 gap-x-6 gap-y-2 border-y py-2 sm:grid-cols-4 sm:gap-x-0 sm:py-0">
        <ConstanteMedida
          etiqueta="Peso"
          valor={`${principal.peso}`}
          unidad="kg"
          delta={anterior ? principal.peso - anterior.peso : null}
        />
        <ConstanteMedida etiqueta="IMC" valor={`${imcActual}`}>
          <BadgeCategoria imc={imcActual} />
        </ConstanteMedida>
        <ConstanteMedida
          etiqueta="Estatura"
          valor={formatearEstatura(principal.estatura)}
        />
        <CeldaObjetivo pesoActual={principal.peso} pesoObjetivo={pesoObjetivo} />
      </dl>

      {previas.length > 0 && (
        <div className="mt-4">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
            Mediciones anteriores
          </p>
          {/* Envolvente con scroll horizontal propio: sin ella, el ancho de la
              columna de variacion desborda el <main> y aparece una segunda
              barra de scroll a nivel de pagina. */}
          <div className="scrollbar-slim -mx-1 overflow-x-auto px-1">
            <Table className="mt-1.5 text-sm">
              <caption className="sr-only">
                Mediciones antropométricas recientes del paciente
              </caption>

              <TableHeader>
                <TableRow className="text-muted-foreground border-transparent text-xs hover:bg-transparent">
                  <TableHead className="h-auto px-0 pb-1.5 text-left font-medium whitespace-nowrap">
                    Fecha
                  </TableHead>
                  <TableHead className="h-auto px-0 pb-1.5 text-right font-medium">
                    Peso
                  </TableHead>
                  <TableHead className="h-auto px-0 pb-1.5 text-right font-medium">
                    IMC
                  </TableHead>
                  <TableHead className="h-auto px-0 pb-1.5 text-right font-medium whitespace-nowrap">
                    Variación
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {previas.map((medida, indice) => (
                  <TableRow key={medida.id} className="border-border/50">
                    <TableCell className="text-muted-foreground px-0 py-2.5">
                      {formatearFechaCorta(medida.fechaMedicion)}
                    </TableCell>
                    <TableCell className="px-0 py-2.5 text-right font-medium tabular-nums">
                      {medida.peso} kg
                    </TableCell>
                    <TableCell className="px-0 py-2.5 text-right tabular-nums">
                      {Number(medida.imc.toFixed(1))}
                    </TableCell>
                    <TableCell className="px-0 py-2.5 pl-4 whitespace-normal">
                      <BarraDelta
                        delta={
                          sinPrecedente.has(medida.id) || !recientes[indice]
                            ? null
                            : medida.peso - recientes[indice].peso
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Panel>
  );
}

function ConstanteMedida({
  etiqueta,
  valor,
  unidad,
  delta,
  children,
}: {
  etiqueta: string;
  valor: string;
  unidad?: string;
  delta?: number | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 py-1.5 sm:border-border/40 sm:border-l sm:px-4 sm:py-3.5 sm:first:border-l-0 sm:first:pl-0">
      <dt className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
        {etiqueta}
      </dt>
      <dd className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
        <span className="text-foreground text-xl font-semibold tracking-tight tabular-nums">
          {valor}
        </span>
        {unidad && (
          <span className="text-muted-foreground text-xs font-medium">
            {unidad}
          </span>
        )}
        {delta !== undefined && <VariacionPeso delta={delta} />}
      </dd>
      {children && <div className="mt-1.5">{children}</div>}
    </div>
  );
}

function CeldaObjetivo({
  pesoActual,
  pesoObjetivo,
}: {
  pesoActual: number;
  pesoObjetivo: number | null;
}) {
  if (pesoObjetivo === null) {
    return (
      <ConstanteMedida etiqueta="Objetivo" valor="—">
        <span className="text-muted-foreground-subtle text-xs">sin definir</span>
      </ConstanteMedida>
    );
  }

  const restante = pesoActual - pesoObjetivo;

  if (Math.abs(restante) < 0.05) {
    return (
      <ConstanteMedida etiqueta="Objetivo" valor={`${pesoObjetivo}`} unidad="kg">
        <span className="text-success inline-flex items-center gap-1 text-xs font-medium">
          <Target className="size-3.5" aria-hidden />
          meta alcanzada
        </span>
      </ConstanteMedida>
    );
  }

  const subio = restante > 0;

  return (
    <ConstanteMedida
      etiqueta="Para el objetivo"
      valor={Math.abs(restante).toFixed(1)}
      unidad="kg"
    >
      <span className={subio ? "text-warning text-xs" : "text-primary text-xs"}>
        {subio ? "por encima de" : "por debajo de"} {pesoObjetivo} kg
      </span>
    </ConstanteMedida>
  );
}

/** Barra de variacion centrada: baja a la izquierda (avance), sube a la derecha. */
function BarraDelta({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="text-muted-foreground-subtle block text-right text-sm">
        —
      </span>
    );
  }

  if (Math.abs(delta) < 0.05) {
    return (
      <span className="text-muted-foreground block text-right text-xs">
        sin cambio
      </span>
    );
  }

  const subio = delta > 0;
  const Icono = subio ? TrendingUp : TrendingDown;
  const ancho = Math.min(50, (Math.abs(delta) / ESCALA_BARRA_KG) * 50);

  return (
    <span className="flex items-center justify-end gap-2.5">
      <span
        aria-hidden
        className="bg-muted relative h-1.5 w-16 shrink-0 rounded-full sm:w-24"
      >
        <span className="border-border absolute inset-y-0 left-1/2 w-px" />
        <span
          className={cn(
            "absolute inset-y-0 rounded-full",
            subio ? "bg-warning left-1/2" : "bg-primary right-1/2",
          )}
          style={{ width: `${ancho}%` }}
        />
      </span>
      <span
        className={cn(
          "inline-flex w-20 items-center justify-end gap-1 text-xs font-medium tabular-nums",
          subio ? "text-warning" : "text-primary",
        )}
      >
        <Icono className="size-3.5" aria-hidden />
        {subio ? "+" : "−"}
        {Math.abs(delta).toFixed(1)}
        <span className="text-muted-foreground font-normal">kg</span>
      </span>
    </span>
  );
}

/** En nutricion clinica bajar de peso suele ser el objetivo: baja = avance. */
function VariacionPeso({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-muted-foreground">—</span>;
  }

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

function TabMedidas({ medidas }: { medidas: MedidaAntropometrica[] }) {
  if (medidas.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin mediciones"
        descripcion="Aún no se ha registrado ninguna medida antropométrica para este paciente."
      />
    );
  }

  const ordenadas = [...medidas].sort((a, b) =>
    b.fechaMedicion.localeCompare(a.fechaMedicion),
  );
  const primera = ordenadas.at(-1);
  const ultima = ordenadas[0];
  const variacion = primera && ultima ? ultima.peso - primera.peso : 0;
  const estable = Math.abs(variacion) < 0.05;
  const subio = variacion > 0;

  return (
    <div className="space-y-4">
      <GraficaMedidas medidas={medidas} />

      <Panel
        titulo="Registro completo"
        icono={ClipboardPlus}
        meta={`${medidas.length} ${
          medidas.length === 1 ? "medición" : "mediciones"
        }`}
      >
        {/* Balance del seguimiento: de donde viene y hacia donde va. */}
        <dl className="border-border/60 grid grid-cols-2 gap-x-6 gap-y-2 border-b pb-4 sm:grid-cols-4 sm:gap-x-0">
          <ResumenMedida
            etiqueta="Primera medición"
            valor={primera ? `${primera.peso} kg` : "—"}
            nota={primera ? formatearFechaCorta(primera.fechaMedicion) : undefined}
          />
          <ResumenMedida
            etiqueta="Última medición"
            valor={ultima ? `${ultima.peso} kg` : "—"}
            nota={ultima ? formatearFechaCorta(ultima.fechaMedicion) : undefined}
          />
          <ResumenMedida
            etiqueta="Variacion total"
            valor={`${subio ? "+" : "−"}${Math.abs(variacion).toFixed(1)} kg`}
            tono={estable ? undefined : subio ? "warning" : "success"}
          />
          <ResumenMedida
            etiqueta="Tendencia"
            valor={estable ? "Estable" : subio ? "Aumento" : "Descenso"}
            tono={estable ? undefined : subio ? "warning" : "success"}
          />
        </dl>

        <div className="scrollbar-slim -mx-1 overflow-x-auto px-1">
          <Table className="mt-4 text-sm">
            <caption className="sr-only">Mediciones antropométricas del paciente</caption>

            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-muted-foreground h-auto px-0 pb-2 text-left text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Fecha
                </TableHead>
                <TableHead className="text-muted-foreground h-auto px-0 pb-2 text-right text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Peso
                </TableHead>
                <TableHead className="text-muted-foreground hidden h-auto px-0 pb-2 text-right text-[11px] font-semibold tracking-[0.14em] uppercase sm:table-cell">
                  Estatura
                </TableHead>
                <TableHead className="text-muted-foreground h-auto px-0 pb-2 text-right text-[11px] font-semibold tracking-[0.14em] uppercase">
                  IMC
                </TableHead>
                <TableHead className="text-muted-foreground hidden h-auto px-0 pb-2 pl-4 text-left text-[11px] font-semibold tracking-[0.14em] uppercase md:table-cell">
                  Categoría
                </TableHead>
                <TableHead className="text-muted-foreground hidden h-auto px-0 pb-2 pl-6 text-left text-[11px] font-semibold tracking-[0.14em] uppercase lg:table-cell">
                  Observaciones
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {ordenadas.map((medida) => {
                const imc = Number(medida.imc.toFixed(1));
                const categoria = categoriaImc(imc);
                return (
                  <TableRow
                    key={medida.id}
                    className="border-border/50 hover:bg-accent/60"
                  >
                    <TableCell className="text-muted-foreground px-0 py-2.5">
                      {formatearFechaHora(medida.fechaMedicion)}
                    </TableCell>
                    <TableCell className="px-0 py-2.5 text-right font-medium tabular-nums">
                      {medida.peso} kg
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden px-0 py-2.5 text-right tabular-nums sm:table-cell">
                      {formatearEstatura(medida.estatura)}
                    </TableCell>
                    <TableCell className="px-0 py-2.5 text-right font-medium tabular-nums">
                      {imc}
                    </TableCell>
                    <TableCell className="hidden px-0 py-2.5 pl-4 whitespace-normal md:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span
                          aria-hidden
                          className={cn("size-1.5 shrink-0 rounded-full", PUNTO_IMC[categoria.tono])}
                        />
                        <span className="text-muted-foreground">{categoria.etiqueta}</span>
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground hidden truncate px-0 py-2.5 pl-6 lg:table-cell"
                      title={medida.notasObservaciones ?? undefined}
                    >
                      {medida.notasObservaciones ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}

const PUNTO_IMC: Record<TonoImc, string> = {
  destructive: "bg-destructive",
  warning: "bg-warning",
  success: "bg-success",
  info: "bg-info",
};

function ResumenMedida({
  etiqueta,
  valor,
  nota,
  tono,
}: {
  etiqueta: string;
  valor: string;
  nota?: string;
  tono?: TonoImc;
}) {
  return (
    <div className="min-w-0 py-1.5 sm:border-border/40 sm:border-l sm:px-4 sm:py-0 sm:first:border-l-0 sm:first:pl-0">
      <dt className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
        {etiqueta}
      </dt>
      <dd
        className={cn(
          "mt-1 text-lg font-semibold tracking-tight tabular-nums",
          tono === "destructive"
            ? "text-destructive"
            : tono === "warning"
              ? "text-warning"
              : tono === "success"
                ? "text-success"
                : "text-foreground",
        )}
      >
        {valor}
      </dd>
      {nota && (
        <dd className="text-muted-foreground-subtle text-xs tabular-nums">
          {nota}
        </dd>
      )}
    </div>
  );
}

function TabFotos({ fotos }: { fotos: FotoSeguimiento[] }) {
  const [modoComparacion, setModoComparacion] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoFoto>(() => {
    const unicos = [...new Set(fotos.map((f) => f.tipo))];
    return (unicos[0] ?? "Frente") as TipoFoto;
  });
  const [fotoA, setFotoA] = useState<string | null>(null);
  const [fotoB, setFotoB] = useState<string | null>(null);

  useEffect(() => {
    setFotoA(null);
    setFotoB(null);
  }, [tipoSeleccionado]);

  if (fotos.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin fotos"
        descripcion="No hay fotos de seguimiento registradas para este paciente."
      />
    );
  }

  const tiposDisponibles = [...new Set(fotos.map((f) => f.tipo))] as TipoFoto[];

  const fotosDelTipo = fotos
    .filter((f) => f.tipo === tipoSeleccionado)
    .sort((a, b) => a.fechaSubida.localeCompare(b.fechaSubida));

  const imgA = fotos.find((f) => f.id === (fotoA ?? fotosDelTipo[0]?.id));
  const imgB = fotos.find((f) => f.id === (fotoB ?? fotosDelTipo[fotosDelTipo.length - 1]?.id));

  if (!modoComparacion) {
    return (
      <div>
        <div className="flex justify-end mb-2">
          <Button variant="outline" size="sm" onClick={() => setModoComparacion(true)}>
            Comparar
          </Button>
        </div>
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
                </div>
                {foto.notas && (
                  <p className="text-muted-foreground mt-2 text-sm">{foto.notas}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Tipo</label>
          <Select
            value={tipoSeleccionado}
            onValueChange={(value) => setTipoSeleccionado(value as TipoFoto)}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="Selecciona tipo" />
            </SelectTrigger>
            <SelectContent>
              {tiposDisponibles.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setModoComparacion(false)}>
          Salir de comparación
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-1 block">Foto A</label>
          <Select
            value={fotoA ?? ""}
            onValueChange={setFotoA}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una foto" />
            </SelectTrigger>
            <SelectContent>
              {fotosDelTipo.map((foto) => (
                <SelectItem key={foto.id} value={foto.id}>
                  {foto.tipo} · {formatearFechaCorta(foto.fechaSubida)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Foto B</label>
          <Select
            value={fotoB ?? ""}
            onValueChange={setFotoB}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una foto" />
            </SelectTrigger>
            <SelectContent>
              {fotosDelTipo.map((foto) => (
                <SelectItem key={foto.id} value={foto.id}>
                  {foto.tipo} · {formatearFechaCorta(foto.fechaSubida)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[imgA, imgB].map((img, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <div className="bg-muted aspect-4/3 w-full overflow-hidden">
              {img ? (
                <img
                  src={img.urlFoto}
                  alt={img.notas ?? img.tipo}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full flex items-center justify-center text-muted-foreground text-sm">
                  Sin imagen
                </div>
              )}
            </div>
            <CardContent className="px-4 py-2 text-sm">
              {img && (
                <span className="text-muted-foreground">
                  {img.tipo} · {formatearFechaCorta(img.fechaSubida)}
                </span>
              )}
            </CardContent>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabDocumentos({ documentos }: { documentos: DocumentoPaciente[] }) {
  if (documentos.length === 0) {
    return <EstadoVacio titulo="Sin documentos" descripcion="No hay análisis, estudios ni recetas asociadas a este paciente." />;
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
            <div className="ml-auto flex shrink-0 items-center gap-1">
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
