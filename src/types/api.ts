/**
 * Tipos que reflejan EXACTAMENTE el contrato del backend .NET.
 *
 * Reglas que hay que respetar al escrever:
 *  - Los enums viajan como TEXTO, no como numero (JsonStringEnumConverter).
 *  - LosGuid son string en JSON.
 *  - Los decimal de C# llegan como number, no como string.
 *  - `DateOnly?` (FechaNacimiento) llega como "YYYY-MM-DD", no ISO completo.
 *  - `DateTime` / `DateTime?` llegan como ISO-8601 UTC con sufijo Z.
 *
 * Cuando el backend cambie, el cambio se hace aqui y el compilador avisa de
 * todos los usos affected. No redeclarar interfaces de domain en cada feature.
 */

export type Guid = string;
export type DateOnlyString = string;
export type DateTimeString = string;

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

export type Sexo = 'M' | 'F' | 'Otro';

export type EstadoCita =
  | 'Programada'
  | 'Confirmada'
  | 'EnCurso'
  | 'Completada'
  | 'Cancelada'
  | 'NoAsistio';

export type TipoConsulta = 'Inicial' | 'Seguimiento' | 'Ajuste' | 'Cierre';

export type TipoFoto = 'Frente' | 'Perfil' | 'Espalda' | 'Otro';

export type TipoDocumento =
  | 'AnalisisLaboratorio'
  | 'EstudioClinico'
  | 'RecetaMedica'
  | 'Otro';

/* -------------------------------------------------------------------------- */
/* Pacientes                                                                   */
/* -------------------------------------------------------------------------- */

export interface Paciente {
  id: Guid;
  nombreCompleto: string;
  direccion: string | null;
  telefono: string;
  correoElectronico: string;
  fechaNacimiento: DateOnlyString | null;
  edad: number | null;
  sexo: Sexo;
  fechaRegistro: DateTimeString;
}

export interface CrearPacienteDto {
  nombreCompleto: string;
  direccion?: string | null;
  telefono: string;
  correoElectronico: string;
  fechaNacimiento?: DateOnlyString | null;
  sexo: Sexo;
}

export type ActualizarPacienteDto = Partial<CrearPacienteDto>;

/* -------------------------------------------------------------------------- */
/* Nutricionistas                                                              */
/* -------------------------------------------------------------------------- */

export interface Nutricionista {
  id: Guid;
  nombreCompleto: string;
  correoElectronico: string;
  telefono: string | null;
  numeroColegiatura: string | null;
  especialidad: string | null;
  isActive: boolean;
  fechaRegistro: DateTimeString;
}

export interface CrearNutricionistaDto {
  nombreCompleto: string;
  correoElectronico: string;
  telefono?: string | null;
  numeroColegiatura?: string | null;
  especialidad?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Citas (agenda)                                                              */
/* -------------------------------------------------------------------------- */

export interface Cita {
  id: Guid;
  pacienteId: Guid;
  pacienteNombre: string;
  nutricionistaId: Guid;
  nutricionistaNombre: string;
  fechaInicio: DateTimeString;
  fechaFin: DateTimeString;
  estado: EstadoCita;
  motivo: string | null;
  consultaId: Guid | null;
  fechaCreacion: DateTimeString;
  fechaCancelacion: DateTimeString | null;
  motivoCancelacion: string | null;
}

export interface CrearCitaDto {
  pacienteId: Guid;
  nutricionistaId: Guid;
  fechaInicio: DateTimeString;
  fechaFin: DateTimeString;
  motivo?: string | null;
}

export interface CitaFiltro {
  desde?: DateTimeString;
  hasta?: DateTimeString;
  nutricionistaId?: Guid;
  pacienteId?: Guid;
  estado?: EstadoCita;
}

export interface CambiarEstadoCitaDto {
  estado: EstadoCita;
  motivo?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Consultas (encuentro clinico)                                              */
/* -------------------------------------------------------------------------- */

export interface Consulta {
  id: Guid;
  pacienteId: Guid;
  pacienteNombre: string;
  citaId: Guid | null;
  nutricionistaId: Guid;
  nutricionistaNombre: string;
  tipoConsulta: TipoConsulta;
  fechaInicio: DateTimeString;
  fechaFin: DateTimeString | null;
  notasClinicas: string | null;
  fechaCreacion: DateTimeString;
}

export interface CrearConsultaDto {
  pacienteId: Guid;
  citaId?: Guid | null;
  nutricionistaId?: Guid | null;
  tipoConsulta: TipoConsulta;
  fechaInicio?: DateTimeString | null;
  notasClinicas?: string | null;
}

export interface CerrarConsultaDto {
  fechaFin?: DateTimeString | null;
  notasClinicas?: string | null;
}

export interface ConsultaFiltro {
  pacienteId?: Guid;
  nutricionistaId?: Guid;
  citaId?: Guid;
  tipoConsulta?: TipoConsulta;
  desde?: DateTimeString;
  hasta?: DateTimeString;
  soloSinCierre?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Registros clinicos                                                          */
/* -------------------------------------------------------------------------- */

export interface MedidaAntropometrica {
  id: Guid;
  pacienteId: Guid;
  consultaId: Guid | null;
  fechaMedicion: DateTimeString;
  peso: number;
  estatura: number;
  imc: number;
  porcentajeGrasa: number | null;
  porcentajeMasaMuscular: number | null;
  medidaCintura: number | null;
  medidaCadera: number | null;
  notasObservaciones: string | null;
}

export interface CrearMedidaDto {
  peso: number;
  estatura: number;
  porcentajeGrasa?: number | null;
  porcentajeMasaMuscular?: number | null;
  medidaCintura?: number | null;
  medidaCadera?: number | null;
  notasObservaciones?: string | null;
  consultaId?: Guid | null;
}

export interface FotoSeguimiento {
  id: Guid;
  pacienteId: Guid;
  consultaId: Guid | null;
  urlFoto: string;
  tipo: TipoFoto;
  fechaSubida: DateTimeString;
  notas: string | null;
}

export interface CrearFotoDto {
  urlFoto: string;
  tipo: TipoFoto;
  notas?: string | null;
  consultaId?: Guid | null;
}

export interface DocumentoPaciente {
  id: Guid;
  pacienteId: Guid;
  consultaId: Guid | null;
  nombreDocumento: string;
  urlDocumento: string;
  tipo: TipoDocumento;
  fechaSubida: DateTimeString;
  observaciones: string | null;
}

export interface CrearDocumentoDto {
  nombreDocumento: string;
  urlDocumento: string;
  tipo: TipoDocumento;
  observaciones?: string | null;
  consultaId?: Guid | null;
}

/* -------------------------------------------------------------------------- */
/* Expediente agregado                                                         */
/* -------------------------------------------------------------------------- */

export interface HistorialClinico {
  id: Guid;
  pacienteId: Guid;
  Diagnostico: string | null;
  antecedentesFamiliares: string | null;
  antecedentesPersonales: string | null;
  medications: string | null;
  alergias: string | null;
  observaciones: string | null;
  fechaActualizacion: DateTimeString | null;
}

export interface ExpedienteCompleto {
  pacienteId: Guid;
  nombreCompleto: string;
  correoElectronico: string;
  telefono: string;
  edad: number | null;
  historialClinico: HistorialClinico | null;
  medidasAntropometricas: MedidaAntropometrica[];
  fotos: FotoSeguimiento[];
  documentos: DocumentoPaciente[];
}
