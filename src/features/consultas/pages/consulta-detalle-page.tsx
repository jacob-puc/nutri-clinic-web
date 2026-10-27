import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarClock, Camera, CheckCircle2, ClipboardList, FileText, Ruler } from "lucide-react";

import { BadgeEstadoCita } from "@/features/citas/components/badge-estado-cita";
import { useCita } from "@/features/citas/hooks/use-citas";
import { formatearFechaLargaLocal, formatearHoraLocal } from "@/features/citas/lib/fechas-cita";
import { BadgeTipoConsulta } from "@/features/consultas/components/badge-tipo-consulta";
import { SeccionCierre } from "@/features/consultas/components/seccion-cierre";
import { SeccionDocumentosConsulta } from "@/features/consultas/components/seccion-documentos-consulta";
import { SeccionFotosConsulta } from "@/features/consultas/components/seccion-fotos-consulta";
import { SeccionMedidasConsulta } from "@/features/consultas/components/seccion-medidas-consulta";
import { useConsulta } from "@/features/consultas/hooks/use-consultas";
import { useExpediente } from "@/features/pacientes/hooks/use-expediente";
import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EstadoError } from "@/components/states/estado-error";
import { Seccion } from "@/components/ficha/seccion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { esApiError, mensajeDeError } from "@/lib/api-error";
import type { Guid } from "@/types/api";

interface Ancla {
  id: string;
  etiqueta: string;
  icono: typeof Ruler;
}

const ANCLAS: Ancla[] = [
  { id: "motivo", etiqueta: "Motivo", icono: ClipboardList },
  { id: "medidas", etiqueta: "Medidas", icono: Ruler },
  { id: "fotos", etiqueta: "Fotos", icono: Camera },
  { id: "documentos", etiqueta: "Documentos", icono: FileText },
  { id: "cierre", etiqueta: "Cierre", icono: CheckCircle2 },
];

/**
 * Espacio de trabajo de una consulta. Secciones apiladas en el orden real de
 * atención, con anclas laterales para saltar entre ellas; nada obliga a seguir
 * un orden (el paciente puede llegar con el análisis antes que la báscula).
 *
 * Una consulta con `fechaFin` se pinta en solo lectura: ya fue cerrada.
 */
export function ConsultaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { data: consulta, isPending, isError, error } = useConsulta(id);

  if (esApiError(error) && error.status === 404) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <EstadoError
          variante="pagina"
          className="border-border"
          titulo="Consulta no encontrada"
          mensaje="Esta consulta no existe o fue eliminada."
        >
          <Button asChild>
            <Link to="/consultas">Volver a consultas</Link>
          </Button>
        </EstadoError>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <EstadoError
          variante="pagina"
          titulo="No pudimos cargar la consulta"
          mensaje={mensajeDeError(error)}
        >
          <Button asChild>
            <Link to="/consultas">Volver a consultas</Link>
          </Button>
        </EstadoError>
      </div>
    );
  }

  if (isPending || !consulta) {
    return <ConsultaSkeleton />;
  }

  const cerrada = consulta.fechaFin !== null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <Breadcrumbs
        etiquetaNav="Navegación de consultas"
        className="mb-4"
        tramos={[
          { etiqueta: "Consultas", href: "/consultas" },
          { etiqueta: consulta.pacienteNombre },
        ]}
      />

      <EncabezadoConsulta
        pacienteId={consulta.pacienteId}
        pacienteNombre={consulta.pacienteNombre}
        tipo={consulta.tipoConsulta}
        nutricionistaNombre={consulta.nutricionistaNombre}
        fechaInicio={consulta.fechaInicio}
        cerrada={cerrada}
      />

      <div className="mt-4 gap-4 lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
        <AnclasLaterales />
        <EspacioDeTrabajo consulta={consulta} cerrada={cerrada} />
      </div>
    </div>
  );
}

function EncabezadoConsulta({
  pacienteId,
  pacienteNombre,
  tipo,
  nutricionistaNombre,
  fechaInicio,
  cerrada,
}: {
  pacienteId: Guid;
  pacienteNombre: string;
  tipo: import("@/types/api").TipoConsulta;
  nutricionistaNombre: string;
  fechaInicio: string;
  cerrada: boolean;
}) {
  return (
    <div className="hoja flex flex-wrap items-center gap-4 rounded-xl px-4 py-5 md:px-5">
      <AvatarPaciente nombre={pacienteNombre} id={pacienteId} className="size-12 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/pacientes/${pacienteId}`}
            className="text-foreground rounded-sm text-xl font-semibold tracking-tight outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {pacienteNombre}
          </Link>
          <BadgeTipoConsulta tipo={tipo} />
        </div>
        <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3.5" aria-hidden />
            {formatearFechaLargaLocal(fechaInicio)} · {formatearHoraLocal(fechaInicio)}
          </span>
          <span>Con {nutricionistaNombre}</span>
        </p>
      </div>
      {cerrada ? (
        <BadgeEstadoCita estado="Completada" />
      ) : (
        <BadgeEstadoCita estado="EnCurso" />
      )}
    </div>
  );
}

function AnclasLaterales() {
  return (
    /* En móvil las anclas quedan ocultas: las secciones ya están apiladas y
       se leen de arriba abajo. En escritorio fijan una guía lateral. */
    <nav
      aria-label="Secciones de la consulta"
      className="sticky top-20 hidden lg:block"
    >
      <ul className="space-y-1">
        {ANCLAS.map(({ id, etiqueta, icono: Icono }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:text-foreground flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icono className="size-4" aria-hidden />
              {etiqueta}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function EspacioDeTrabajo({
  consulta,
  cerrada,
}: {
  consulta: import("@/types/api").Consulta;
  cerrada: boolean;
}) {
  const { data: expediente, isPending: cargandoExpediente } = useExpediente(consulta.pacienteId);
  const { data: cita } = useCita(consulta.citaId ?? undefined);

  const medidas = useMemo(
    () =>
      (expediente?.medidasAntropometricas ?? [])
        .filter((medida) => medida.consultaId === consulta.id)
        .sort((a, b) => a.fechaMedicion.localeCompare(b.fechaMedicion)),
    [expediente, consulta.id],
  );
  const fotos = useMemo(
    () =>
      (expediente?.fotos ?? [])
        .filter((foto) => foto.consultaId === consulta.id)
        .sort((a, b) => a.fechaSubida.localeCompare(b.fechaSubida)),
    [expediente, consulta.id],
  );
  const documentos = useMemo(
    () => (expediente?.documentos ?? []).filter((doc) => doc.consultaId === consulta.id),
    [expediente, consulta.id],
  );

  /* La estatura sugerida viene de la última medición del paciente, no de esta
     consulta, para no pedirla dos veces seguidas. */
  const estaturaSugerida = useMemo(() => {
    const historial = (expediente?.medidasAntropometricas ?? [])
      .filter((medida) => medida.consultaId !== consulta.id)
      .sort((a, b) => b.fechaMedicion.localeCompare(a.fechaMedicion));
    return historial[0]?.estatura;
  }, [expediente, consulta.id]);

  return (
    <div className="min-w-0 space-y-4">
      <section id="motivo" className="scroll-mt-24">
        <Seccion titulo="Motivo de la atención" icono={ClipboardList}>
          {cargandoExpediente ? (
            <Skeleton className="h-4 w-3/4" />
          ) : (
            <p className="text-foreground text-sm">
              {cita?.motivo ?? consulta.notasClinicas ?? "Sin motivo registrado."}
            </p>
          )}
        </Seccion>
      </section>

      <section id="medidas" className="scroll-mt-24">
        {cargandoExpediente ? (
          <SeccionSkeleton />
        ) : (
          <SeccionMedidasConsulta
            pacienteId={consulta.pacienteId}
            consultaId={consulta.id}
            medidas={medidas}
            estaturaSugerida={estaturaSugerida}
            soloLectura={cerrada}
          />
        )}
      </section>

      <section id="fotos" className="scroll-mt-24">
        {cargandoExpediente ? (
          <SeccionSkeleton />
        ) : (
          <SeccionFotosConsulta
            pacienteId={consulta.pacienteId}
            consultaId={consulta.id}
            fotos={fotos}
            soloLectura={cerrada}
          />
        )}
      </section>

      <section id="documentos" className="scroll-mt-24">
        {cargandoExpediente ? (
          <SeccionSkeleton />
        ) : (
          <SeccionDocumentosConsulta
            pacienteId={consulta.pacienteId}
            consultaId={consulta.id}
            documentos={documentos}
            soloLectura={cerrada}
          />
        )}
      </section>

      <section id="cierre" className="scroll-mt-24">
        {cerrada ? (
          <Seccion titulo="Consulta cerrada" icono={CheckCircle2}>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <div className="py-1">
                <dt className="text-muted-foreground text-xs font-medium">Fecha de cierre</dt>
                <dd className="text-foreground mt-1 text-sm">
                  {formatearFechaLargaLocal(consulta.fechaFin)} ·{" "}
                  {formatearHoraLocal(consulta.fechaFin)}
                </dd>
              </div>
            </dl>
            {consulta.notasClinicas && (
              <div className="mt-2">
                <p className="text-muted-foreground text-xs font-medium">Notas clínicas</p>
                <p className="text-foreground mt-1 text-sm whitespace-pre-wrap">
                  {consulta.notasClinicas}
                </p>
              </div>
            )}
          </Seccion>
        ) : (
          <SeccionCierre consultaId={consulta.id} notasIniciales={consulta.notasClinicas} />
        )}
      </section>
    </div>
  );
}

function SeccionSkeleton() {
  return (
    <div className="hoja space-y-3 overflow-hidden rounded-xl px-4 py-5 md:px-5">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  );
}

function ConsultaSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <Skeleton className="mb-4 h-5 w-28" />
      <div className="hoja flex items-center gap-4 rounded-xl px-4 py-5 md:px-5">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="mt-4 space-y-4">
        <SeccionSkeleton />
        <SeccionSkeleton />
      </div>
    </div>
  );
}
