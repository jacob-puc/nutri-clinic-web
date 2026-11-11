import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarClock } from "lucide-react";

import { BadgeEstadoCita } from "@/features/citas/components/badge-estado-cita";
import { useCita } from "@/features/citas/hooks/use-citas";
import { formatearFechaLargaLocal, formatearHoraLocal } from "@/features/citas/lib/fechas-cita";
import { BadgeTipoConsulta } from "@/features/consultas/components/badge-tipo-consulta";
import { PanelNotas } from "@/features/consultas/components/panel-notas";
import { ResumenConsulta } from "@/features/consultas/components/resumen-consulta";
import { SeccionDocumentosConsulta } from "@/features/consultas/components/seccion-documentos-consulta";
import { SeccionFotosConsulta } from "@/features/consultas/components/seccion-fotos-consulta";
import { SeccionPlanConsulta } from "@/features/consultas/components/seccion-plan-consulta";
import { SeccionMedidasConsulta, UltimasMedidas } from "@/features/consultas/components/seccion-medidas-consulta";
import { useConsulta } from "@/features/consultas/hooks/use-consultas";
import { useExpediente } from "@/features/pacientes/hooks/use-expediente";
import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { historialVacio, PanelHistorialClinico } from "@/features/pacientes/components/historial-clinico";
import { EstadoError } from "@/components/states/estado-error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { esApiError, mensajeDeError } from "@/lib/api-error";
import type { Consulta } from "@/types/api";

/**
 * Espacio de trabajo de una consulta. Nada obliga a seguir un orden: fotos y
 * documentos son opcionales y las notas se escriben en cualquier momento.
 *
 * Una consulta con `fechaFin` se pinta en solo lectura: ya fue cerrada.
 */
export function ConsultaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { data: consulta, isPending, isError, error } = useConsulta(id);

  if (esApiError(error) && error.status === 404) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
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
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <Breadcrumbs
        etiquetaNav="Navegación de consultas"
        className="mb-4"
        tramos={[
          { etiqueta: "Consultas", href: "/consultas" },
          { etiqueta: consulta.pacienteNombre },
        ]}
      />

      {/* Cerrada se lee como resumen; abierta es el espacio de trabajo. */}
      {consulta.fechaFin !== null ? (
        <ResumenConsulta consulta={consulta} />
      ) : (
        <EspacioDeTrabajo consulta={consulta} cerrada={false} />
      )}
    </div>
  );
}

/**
 * Una sola hoja arriba con lo que se mira primero (paciente, motivo y
 * medidas) y, debajo, dos columnas: el material de la consulta a la
 * izquierda y las notas fijas a la derecha.
 */
function EspacioDeTrabajo({ consulta, cerrada }: { consulta: Consulta; cerrada: boolean }) {
  const { data: expediente, isPending: cargandoExpediente } = useExpediente(consulta.pacienteId);
  const { data: cita, isPending: cargandoCita } = useCita(consulta.citaId ?? undefined);

  const medidas = useMemo(
    () =>
      (expediente?.medidasAntropometricas ?? [])
        .filter((medida) => medida.consultaId === consulta.id)
        .sort((a, b) => Date.parse(a.fechaMedicion) - Date.parse(b.fechaMedicion)),
    [expediente, consulta.id],
  );
  /* La referencia es la ultima medicion fuera de esta consulta: de ahi salen
     los cambios y la estatura sugerida, para no pedirla dos veces. */
  const anterior = useMemo(
    () =>
      (expediente?.medidasAntropometricas ?? [])
        .filter(
          (medida) =>
            medida.consultaId !== consulta.id &&
            Date.parse(medida.fechaMedicion) <= Date.parse(consulta.fechaInicio),
        )
        .sort((a, b) => Date.parse(b.fechaMedicion) - Date.parse(a.fechaMedicion))[0],
    [expediente, consulta.id, consulta.fechaInicio],
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

  /* El motivo vive en la cita; una atencion sin cita no lo tiene. */
  const motivo = consulta.citaId
    ? cargandoCita
      ? null
      : (cita?.motivo ?? "Sin motivo registrado en la cita.")
    : "Atención sin cita previa.";

  return (
    <>
      <div className="hoja rounded-[1.25rem]">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <AvatarPaciente nombre={consulta.pacienteNombre} id={consulta.pacienteId} className="size-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/pacientes/${consulta.pacienteId}`}
                className="text-foreground rounded-sm text-lg font-semibold tracking-tight outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                {consulta.pacienteNombre}
              </Link>
              <BadgeTipoConsulta tipo={consulta.tipoConsulta} />
            </div>
            <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3.5" aria-hidden />
                {formatearFechaLargaLocal(consulta.fechaInicio)} · {formatearHoraLocal(consulta.fechaInicio)}
              </span>
              <span>Con {consulta.nutricionistaNombre}</span>
            </p>
          </div>
          <BadgeEstadoCita estado={cerrada ? "Completada" : "EnCurso"} />
        </div>

        {/* Solo lectura: motivo y las medidas mas recientes del paciente. La
            captura de medidas vive abajo, en su propia seccion. */}
        <div className="border-border grid gap-x-8 gap-y-3 border-t border-dashed px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:px-6">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Motivo</p>
            {motivo === null ? (
              <Skeleton className="mt-1.5 h-4 w-2/3" />
            ) : (
              <p className="text-foreground mt-1 text-sm">{motivo}</p>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Medidas anteriores</p>
            <div className="mt-1">
              {cargandoExpediente ? (
                <Skeleton className="h-4 w-3/4" />
              ) : (
                <UltimasMedidas
                  medidas={expediente?.medidasAntropometricas ?? []}
                  consultaId={consulta.id}
                  inicioConsulta={consulta.fechaInicio}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {cargandoExpediente ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : (
          <SeccionMedidasConsulta
            pacienteId={consulta.pacienteId}
            consultaId={consulta.id}
            medida={medidas.at(-1)}
            anterior={anterior}
            soloLectura={cerrada}
          />
        )}
      </div>

      {/* Se pide en la consulta solo mientras falte: una vez capturado se
          consulta y edita desde el expediente. */}
      {!cargandoExpediente && !cerrada && historialVacio(expediente?.historialClinico) && (
        <PanelHistorialClinico className="mt-8" pacienteId={consulta.pacienteId} historial={expediente?.historialClinico} />
      )}

      {!cargandoExpediente && (
        <div className="mt-8">
          <SeccionPlanConsulta
            pacienteId={consulta.pacienteId}
            medidaReferencia={medidas.at(-1) ?? anterior}
            historial={expediente?.historialClinico}
            soloLectura={cerrada}
          />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {/* En movil las notas van justo despues de la hoja: son lo que mas se
            usa. En escritorio pasan a la columna derecha y se quedan fijas. */}
        <aside className="lg:sticky lg:top-20 lg:order-last">
          <PanelNotas consulta={consulta} />
        </aside>

        <div className="min-w-0 space-y-8">
          {cargandoExpediente ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <SeccionFotosConsulta
                pacienteId={consulta.pacienteId}
                consultaId={consulta.id}
                fotos={fotos}
                soloLectura={cerrada}
              />
              <SeccionDocumentosConsulta
                pacienteId={consulta.pacienteId}
                consultaId={consulta.id}
                documentos={documentos}
                soloLectura={cerrada}
              />
              {cerrada && fotos.length === 0 && documentos.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  En esta consulta no se adjuntaron fotos ni documentos.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ConsultaSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <Skeleton className="mb-4 h-5 w-28" />
      <div className="hoja rounded-[1.25rem] px-4 py-5 md:px-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
