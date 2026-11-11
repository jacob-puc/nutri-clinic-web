import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, CalendarClock, Clock, FolderOpen, Minus, Ruler, Stethoscope, UserRound } from "lucide-react";

import { Seccion } from "@/components/ficha/seccion";
import { AnilloImc } from "@/components/ui/anillo-imc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCita } from "@/features/citas/hooks/use-citas";
import { formatearFechaLargaLocal, formatearHoraLocal } from "@/features/citas/lib/fechas-cita";
import { BadgeTipoConsulta } from "@/features/consultas/components/badge-tipo-consulta";
import { PanelNotas } from "@/features/consultas/components/panel-notas";
import { SeccionDocumentosConsulta } from "@/features/consultas/components/seccion-documentos-consulta";
import { SeccionFotosConsulta } from "@/features/consultas/components/seccion-fotos-consulta";
import { SeccionPlanConsulta } from "@/features/consultas/components/seccion-plan-consulta";
import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import { useExpediente } from "@/features/pacientes/hooks/use-expediente";
import { categoriaImc } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Consulta, MedidaAntropometrica } from "@/types/api";

const fmt = (valor: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(valor);

const PASTILLA_IMC = {
  success: "bg-success-soft text-success-soft-foreground",
  info: "bg-info-soft text-info-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
  destructive: "bg-destructive-soft text-destructive-soft-foreground",
} as const;

/**
 * Lectura de una consulta ya cerrada. No es el espacio de trabajo con sus
 * secciones de captura: es un resumen de lo que paso, con solo lo que se
 * registro (sin bloques vacios) y las notas y el cobro a un lado.
 */
export function ResumenConsulta({ consulta }: { consulta: Consulta }) {
  const { data: expediente, isPending: cargando } = useExpediente(consulta.pacienteId);
  const { data: cita, isPending: cargandoCita } = useCita(consulta.citaId ?? undefined);

  const todas = useMemo(
    () => [...(expediente?.medidasAntropometricas ?? [])].sort((a, b) => Date.parse(a.fechaMedicion) - Date.parse(b.fechaMedicion)),
    [expediente],
  );
  const medida = useMemo(() => todas.filter((m) => m.consultaId === consulta.id).at(-1), [todas, consulta.id]);
  const anterior = useMemo(
    () => (medida ? todas.filter((m) => Date.parse(m.fechaMedicion) < Date.parse(medida.fechaMedicion)).at(-1) : undefined),
    [todas, medida],
  );
  const fotos = (expediente?.fotos ?? []).filter((f) => f.consultaId === consulta.id);
  const documentos = (expediente?.documentos ?? []).filter((d) => d.consultaId === consulta.id);

  const minutos = consulta.fechaFin
    ? Math.max(1, Math.round((Date.parse(consulta.fechaFin) - Date.parse(consulta.fechaInicio)) / 60_000))
    : null;
  const motivo = consulta.citaId ? (cargandoCita ? null : cita?.motivo ?? null) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="min-w-0 space-y-6">
        {/* ---------- Quien, cuando y por que ---------- */}
        <section className="hoja anim-vista rounded-[1.5rem] p-6 md:p-8">
          <div className="flex flex-wrap items-start gap-4">
            <AvatarPaciente nombre={consulta.pacienteNombre} id={consulta.pacienteId} className="size-14 shrink-0 text-base" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-editorial text-foreground text-3xl leading-tight font-normal tracking-tight">
                  {consulta.pacienteNombre}
                </h1>
                <BadgeTipoConsulta tipo={consulta.tipoConsulta} />
              </div>
              <p className="text-muted-foreground mt-1 text-sm">Consulta cerrada</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/pacientes/${consulta.pacienteId}`}>
                <FolderOpen className="size-4" />
                Ver expediente
              </Link>
            </Button>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
            <Dato icono={CalendarClock} etiqueta="Fecha">
              <span className="first-letter:uppercase">{formatearFechaLargaLocal(consulta.fechaInicio)}</span>
            </Dato>
            <Dato icono={Clock} etiqueta="Horario">
              {formatearHoraLocal(consulta.fechaInicio)}
              {consulta.fechaFin && ` – ${formatearHoraLocal(consulta.fechaFin)}`}
              {minutos && <span className="text-muted-foreground"> · {minutos} min</span>}
            </Dato>
            <Dato icono={UserRound} etiqueta="Atendió">
              {consulta.nutricionistaNombre}
            </Dato>
          </dl>

          {consulta.citaId && (
            <div className="bg-surface-subtle mt-5 rounded-2xl px-4 py-3">
              <p className="text-muted-foreground text-xs">Motivo de la cita</p>
              {motivo === null && cargandoCita ? (
                <Skeleton className="mt-1.5 h-4 w-1/2" />
              ) : (
                <p className="text-foreground mt-0.5">{motivo ?? "Sin motivo registrado."}</p>
              )}
            </div>
          )}
        </section>

        {/* ---------- Medidas tomadas ---------- */}
        {cargando ? (
          <Skeleton className="h-40 w-full rounded-[1.25rem]" />
        ) : (
          <Seccion titulo="Medidas de esta consulta" icono={Ruler} className="anim-vista">
            {medida ? (
              <MedidasConsulta medida={medida} anterior={anterior} />
            ) : (
              <p className="text-muted-foreground py-2 text-sm">En esta consulta no se registraron medidas.</p>
            )}
          </Seccion>
        )}

        {!cargando && (
          <SeccionPlanConsulta
            pacienteId={consulta.pacienteId}
            medidaReferencia={medida ?? anterior}
            historial={expediente?.historialClinico}
            soloLectura
            titulo="Plan actual del paciente"
          />
        )}

        {/* Fotos y documentos solo si los hubo: un bloque vacio no dice nada. */}
        {fotos.length > 0 && (
          <SeccionFotosConsulta pacienteId={consulta.pacienteId} consultaId={consulta.id} fotos={fotos} soloLectura />
        )}
        {documentos.length > 0 && (
          <SeccionDocumentosConsulta pacienteId={consulta.pacienteId} consultaId={consulta.id} documentos={documentos} soloLectura />
        )}
      </div>

      <aside className="anim-vista lg:sticky lg:top-20">
        <PanelNotas consulta={consulta} />
      </aside>
    </div>
  );
}

function Dato({ icono: Icono, etiqueta, children }: { icono: typeof Clock; etiqueta: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Icono className="size-3.5" aria-hidden />
        {etiqueta}
      </dt>
      <dd className="text-foreground mt-1 font-medium">{children}</dd>
    </div>
  );
}

function MedidasConsulta({ medida, anterior }: { medida: MedidaAntropometrica; anterior?: MedidaAntropometrica }) {
  const cambio = anterior ? medida.peso - anterior.peso : null;
  const categoria = categoriaImc(medida.imc);
  const extras = [
    { etiqueta: "Grasa corporal", valor: medida.porcentajeGrasa, unidad: "%" },
    { etiqueta: "Masa muscular", valor: medida.porcentajeMasaMuscular, unidad: "%" },
    { etiqueta: "Cintura", valor: medida.medidaCintura, unidad: "cm" },
    { etiqueta: "Cadera", valor: medida.medidaCadera, unidad: "cm" },
  ].filter((e): e is { etiqueta: string; valor: number; unidad: string } => e.valor !== null && e.valor !== undefined);
  const IconoCambio = cambio === null || Math.abs(cambio) < 0.05 ? Minus : cambio < 0 ? ArrowDown : ArrowUp;

  return (
    <div className="space-y-5">
      <div className="grid items-center gap-x-8 gap-y-5 sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-xs">Peso</p>
          <p className="text-foreground mt-0.5 text-3xl font-semibold tracking-tight tabular-nums">{fmt(medida.peso)} kg</p>
          {cambio !== null && (
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
              <IconoCambio className="size-3.5" aria-hidden />
              {Math.abs(cambio) < 0.05 ? "Sin cambio" : `${fmt(Math.abs(cambio))} kg`} vs la anterior
            </p>
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Estatura</p>
          <p className="text-foreground mt-0.5 text-3xl font-semibold tracking-tight tabular-nums">{fmt(medida.estatura)} cm</p>
        </div>
        <div className="flex items-center gap-3">
          <AnilloImc imc={medida.imc} compacto className="w-20 shrink-0" />
          <div>
            <p className="text-muted-foreground text-xs">IMC</p>
            <p className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium", PASTILLA_IMC[categoria.tono])}>
              {categoria.etiqueta}
            </p>
          </div>
        </div>
      </div>

      {extras.length > 0 && (
        <dl className="border-border grid gap-4 border-t pt-4 sm:grid-cols-4">
          {extras.map((e) => (
            <div key={e.etiqueta}>
              <dt className="text-muted-foreground text-xs">{e.etiqueta}</dt>
              <dd className="text-foreground mt-0.5 text-lg font-semibold tabular-nums">
                {fmt(e.valor)} {e.unidad}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {medida.notasObservaciones && (
        <p className="bg-surface-subtle text-foreground flex gap-2 rounded-2xl px-4 py-3 text-sm">
          <Stethoscope className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          {medida.notasObservaciones}
        </p>
      )}
    </div>
  );
}
