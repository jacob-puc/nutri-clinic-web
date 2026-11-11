
export type Guid = string;
export type DateOnlyString = string;
export type DateTimeString = string;

export type Sexo = 'M' | 'F' | 'Otro';

export type EstadoCita =
  | 'Programada'
  | 'Confirmada'
  | 'EnCurso'
  | 'Completada'
  | 'Cancelada'
  | 'NoAsistio';

/** Por donde llego la cita (null en las anteriores a este campo). */
export type CanalCita = 'Presencial' | 'Telefono' | 'WhatsApp' | 'EnLinea';

export type TipoConsulta = 'Inicial' | 'Seguimiento' | 'Ajuste' | 'Cierre';

export type TipoFoto = 'Frente' | 'Perfil' | 'Espalda' | 'Otro';

export type TipoDocumento =
  | 'AnalisisLaboratorio'
  | 'EstudioClinico'
  | 'RecetaMedica'
  | 'Otro';

export interface Paciente {
  id: Guid;
  nombreCompleto: string;
  direccion: string | null;
  telefono: string;
  correoElectronico: string;
  fechaNacimiento: DateOnlyString | null;
  edad: number | null;
  sexo: Sexo;
  tituloObjetivo: string | null;
  pesoObjetivo: number | null;
  fechaRegistro: DateTimeString;
  /** Se registro solo al reservar en linea; se limpia al guardar su ficha. */
  datosPorCompletar: boolean;
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

/** El objetivo se captura en consulta, por eso viaja a su propio endpoint. */
export interface ActualizarObjetivoPacienteDto {
  tituloObjetivo: string | null;
  pesoObjetivo: number | null;
}

/** Administrador y Nutricionista atienden; Recepcion agenda y cobra, sin ver lo clinico. */
export type RolUsuario = 'Administrador' | 'Nutricionista' | 'Recepcion';

export interface Nutricionista {
  id: Guid;
  nombreCompleto: string;
  correoElectronico: string;
  telefono: string | null;
  numeroColegiatura: string | null;
  especialidad: string | null;
  rol: RolUsuario;
  /** La contraseña es temporal (la puso un administrador). */
  debeCambiarContrasena: boolean;
  isActive: boolean;
  fechaRegistro: DateTimeString;
}

export interface CrearNutricionistaDto {
  nombreCompleto: string;
  correoElectronico: string;
  telefono?: string | null;
  numeroColegiatura?: string | null;
  especialidad?: string | null;
  rol: RolUsuario;
  /** Temporal: la cuenta debe cambiarla en su primer inicio de sesion. */
  contrasena: string;
}

export interface ActualizarNutricionistaDto {
  nombreCompleto: string;
  correoElectronico: string;
  telefono?: string | null;
  numeroColegiatura?: string | null;
  especialidad?: string | null;
  /** Solo el administrador, y nunca el propio. Omitido lo deja igual. */
  rol?: RolUsuario | null;
}

export interface CitaPendiente {
  id: Guid;
  pacienteId: Guid;
  pacienteNombre: string;
  fechaInicio: DateTimeString;
  fechaFin: DateTimeString;
  estado: EstadoCita;
}

/** Bloque semanal de atencion; horas "HH:mm" en hora de la clinica. */
export interface BloqueHorario {
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
}

export interface HorarioPersona {
  nutricionistaId: Guid;
  /** false: atiende en el horario general de la clinica. */
  horarioPropio: boolean;
  duracionConsultaMinutos: number;
  /** Los que aplican: propios o, si no tiene, los de la clinica. */
  bloques: BloqueHorario[];
}

export interface Horarios {
  clinica: BloqueHorario[];
  personas: HorarioPersona[];
}

export interface ActualizarHorarioPersonaDto {
  horarioPropio: boolean;
  duracionConsultaMinutos: number;
  bloques: BloqueHorario[];
}

export interface Ausencia {
  id: Guid;
  nutricionistaId: Guid;
  nutricionistaNombre: string;
  /** "YYYY-MM-DD", dias completos en hora de la clinica. */
  fechaInicio: string;
  fechaFin: string;
  motivo: string | null;
}

export interface CrearAusenciaDto {
  fechaInicio: string;
  fechaFin: string;
  motivo?: string | null;
}

export interface AusenciaCreada {
  ausencia: Ausencia;
  /** Citas pendientes en esos dias: hay que reasignarlas o moverlas. */
  citasAfectadas: CitaPendiente[];
}

/** Espacio libre para empezar una cita (base de la reservacion en linea). */
export interface Hueco {
  inicio: DateTimeString;
  fin: DateTimeString;
  /** "HH:mm" en hora de la clinica. */
  hora: string;
}

export interface DisponibilidadDia {
  fecha: string;
  motivoNoDisponible: string | null;
  huecos: Hueco[];
}

export interface Disponibilidad {
  nutricionistaId: Guid;
  nutricionistaNombre: string;
  duracionMinutos: number;
  dias: DisponibilidadDia[];
}

export interface ResultadoReasignacion {
  reasignadas: number;
  /** Chocan con la agenda de quien recibe: se quedan sin mover. */
  conflictos: CitaPendiente[];
}

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
  canal: CanalCita | null;
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
  canal?: CanalCita | null;
}

export interface CitaFiltro {
  desde?: DateTimeString;
  hasta?: DateTimeString;
  nutricionistaId?: Guid;
  pacienteId?: Guid;
  estado?: EstadoCita;
}

/**
 * Envoltorio que el backend devuelve en los listados paginados
 * (CitasController.ObtenerCitas). El tope que aplica el servidor es 100.
 */
export interface RespuestaPaginada<T> {
  totalRegistros: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
  datos: T[];
}

export interface CambiarEstadoCitaDto {
  estado: EstadoCita;
  motivo?: string | null;
}

/** No trae pacienteId: el paciente de una cita es inmutable. */
export interface ActualizarCitaDto {
  nutricionistaId: Guid;
  fechaInicio: DateTimeString;
  fechaFin: DateTimeString;
  motivo?: string | null;
}

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

/** El PUT reemplaza todos los campos: lo que no viaje queda en null. */
export type ActualizarMedidaDto = Omit<CrearMedidaDto, 'consultaId'>;

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

/**
 * Cuerpo multipart de `POST /api/pacientes/{id}/fotos/subir`. El archivo va en
 * `FormData`; el resto son campos de texto. `consultaId` enlaza la foto con la
 * consulta en curso para que salga en su expediente.
 */
export interface SubirFotoDto {
  archivo: File;
  consultaId?: Guid | null;
  tipo: TipoFoto;
  notas?: string | null;
}

/** Cuerpo multipart de `POST /api/pacientes/{id}/documentos/subir`. */
export interface SubirDocumentoDto {
  archivo: File;
  consultaId?: Guid | null;
  tipo: TipoDocumento;
  observaciones?: string | null;
}

export interface HistorialClinico {
  id: Guid;
  pacienteId: Guid;
  /** Condiciones de salud; puede faltar en respuestas anteriores a su alta. */
  enfermedades?: string[];
  alergias: string[];
  alimentosFavoritos: string[];
  alimentosNoFavoritos: string[];
}

/** El PUT reemplaza el historial completo. */
export interface CrearHistorialClinicoDto {
  enfermedades: string[];
  alergias: string[];
  alimentosFavoritos: string[];
  alimentosNoFavoritos: string[];
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

/* ==================== MENÚS / PLANES ==================== */

/* Los enums viajan como texto (JsonStringEnumConverter en el backend). */
export type DiaSemana =
  | 'Lunes'
  | 'Martes'
  | 'Miercoles'
  | 'Jueves'
  | 'Viernes'
  | 'Sabado'
  | 'Domingo';

export type TiempoComida =
  | 'Desayuno'
  | 'MediaManana'
  | 'Almuerzo'
  | 'Merienda'
  | 'Cena'
  | 'Colacion';

export type MenuAsignadoEstado = 'Borrador' | 'Activo' | 'Finalizado';

/* ---------- Alimentos: macros por cada 100 g ---------- */

/** Medida casera de un alimento: "pieza" = 50 g. */
export interface MedidaCasera {
  id?: Guid | null;
  nombre: string;
  gramos: number;
}

export interface Alimento {
  id: Guid;
  nombre: string;
  medidas: MedidaCasera[];
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  imagenUrl: string | null;
  fechaCreacion: DateTimeString;
  isActive: boolean;
  /** Calorias que salen de los macros (4/4/9); sirve para detectar errores de captura. */
  caloriasEstimadas: number;
  diferenciaCalorica: number;
}

export interface CrearAlimentoDto {
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  imagenUrl?: string | null;
  /** Lista completa; sin ella se dejan las que tenga. */
  medidas?: MedidaCasera[];
}

export type ActualizarAlimentoDto = CrearAlimentoDto;

export interface AlimentoFiltro {
  buscar?: string;
  soloActivos?: boolean;
  ordenarPor?: 'nombre' | 'calorias';
  descendente?: boolean;
}

/* ---------- Platos ---------- */

export interface DetallePlato {
  id: Guid;
  alimentoId: Guid;
  alimentoNombre: string;
  /** Siempre en gramos: de aqui salen las macros. */
  racionGramos: number;
  /** Como se capturo, si fue en medida casera. */
  medidaCantidad: number | null;
  medidaNombre: string | null;
  /** "2 piezas"; null si se capturo en gramos. */
  medidaTexto: string | null;
  orden: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

export interface Plato {
  id: Guid;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
  nutricionistaId: Guid | null;
  nutricionistaNombre: string | null;
  /** Lo calcula el backend: mas de un alimento. */
  esCompuesto: boolean;
  detalles: DetallePlato[];
  caloriasTotales: number;
  proteinasTotales: number;
  carbohidratosTotales: number;
  grasasTotales: number;
  fechaCreacion: DateTimeString;
  isActive: boolean;
}

export interface DetallePlatoDto {
  /** Presente al editar una fila que ya existia. */
  id?: Guid | null;
  alimentoId: Guid;
  racionGramos: number;
  medidaCantidad?: number | null;
  medidaNombre?: string | null;
  orden: number;
}

export interface CrearPlatoDto {
  nombre: string;
  descripcion?: string | null;
  imagenUrl?: string | null;
  nutricionistaId?: Guid | null;
  detalles: DetallePlatoDto[];
}

export interface ActualizarPlatoDto {
  nombre: string;
  descripcion?: string | null;
  imagenUrl?: string | null;
  detalles: DetallePlatoDto[];
}

export interface PlatoFiltro {
  buscar?: string;
  nutricionistaId?: Guid;
  soloCompuestos?: boolean;
  soloActivos?: boolean;
  ordenarPor?: 'nombre' | 'calorias' | 'fechaCreacion';
  descendente?: boolean;
}

/* ---------- Detalle semanal (comun a plantillas y planes) ---------- */

export interface DetalleSemanal {
  id: Guid;
  platoId: Guid;
  platoNombre: string;
  diaSemana: DiaSemana;
  tiempoComida: TiempoComida;
  /** Porciones del plato. */
  cantidad: number;
  indicaciones: string | null;
  orden: number;
  /** Macros ya multiplicadas por la cantidad. */
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

export interface DetalleSemanalDto {
  id?: Guid | null;
  platoId: Guid;
  diaSemana: DiaSemana;
  tiempoComida: TiempoComida;
  cantidad: number;
  indicaciones?: string | null;
  orden: number;
}

export interface ResumenTiempoComida {
  diaSemana: DiaSemana;
  tiempoComida: TiempoComida;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

/* ---------- Plantillas de menu ---------- */

export interface PlantillaMenu {
  id: Guid;
  nombre: string;
  descripcion: string | null;
  /** Objetivo diario en kcal. */
  objetivoCalorico: number | null;
  nutricionistaId: Guid | null;
  nutricionistaNombre: string | null;
  detalles: DetalleSemanal[];
  /** Suma de toda la semana. */
  caloriasTotales: number;
  proteinasTotales: number;
  carbohidratosTotales: number;
  grasasTotales: number;
  desviacionCalorica: number | null;
  resumenPorTiempoComida: ResumenTiempoComida[];
  fechaCreacion: DateTimeString;
  isActive: boolean;
}

export interface CrearPlantillaMenuDto {
  nombre: string;
  descripcion?: string | null;
  objetivoCalorico?: number | null;
  nutricionistaId?: Guid | null;
  detalles: DetalleSemanalDto[];
}

export interface ActualizarPlantillaMenuDto {
  nombre: string;
  descripcion?: string | null;
  objetivoCalorico?: number | null;
  detalles: DetalleSemanalDto[];
}

export interface PlantillaMenuFiltro {
  buscar?: string;
  nutricionistaId?: Guid;
  soloActivos?: boolean;
  ordenarPor?: 'nombre' | 'objetivocalorico' | 'fechacreacion';
  descendente?: boolean;
}

export interface DuplicarPlantillaMenuDto {
  nombre?: string | null;
}

/* ---------- Menus asignados (plan de un paciente) ---------- */

export interface MenuAsignado {
  id: Guid;
  pacienteId: Guid;
  pacienteNombre: string;
  plantillaMenuId: Guid | null;
  plantillaMenuNombre: string | null;
  nombre: string;
  descripcion: string | null;
  objetivoCalorico: number | null;
  fechaInicio: DateOnlyString;
  estado: MenuAsignadoEstado;
  detalles: DetalleSemanal[];
  caloriasTotales: number;
  proteinasTotales: number;
  carbohidratosTotales: number;
  grasasTotales: number;
  desviacionCalorica: number | null;
  resumenPorTiempoComida: ResumenTiempoComida[];
  fechaCreacion: DateTimeString;
  isActive: boolean;
}

/** El plan siempre nace copiando una plantilla; los platos vienen de ella. */
export interface CrearMenuAsignadoDto {
  pacienteId: Guid;
  plantillaMenuId: Guid;
  nombre: string;
  descripcion?: string | null;
  objetivoCalorico?: number | null;
  fechaInicio: DateOnlyString;
  estado: MenuAsignadoEstado;
}

export interface ActualizarMenuAsignadoDto {
  nombre: string;
  descripcion?: string | null;
  objetivoCalorico?: number | null;
  /** Solo se puede cambiar mientras el plan esta en borrador. */
  fechaInicio?: DateOnlyString | null;
  estado: MenuAsignadoEstado;
  detalles: DetalleSemanalDto[];
}

export interface MenuAsignadoFiltro {
  pacienteId?: Guid;
  estado?: MenuAsignadoEstado;
  soloActivos?: boolean;
  ordenarPor?: 'nombre' | 'fechainicio' | 'fechacreacion';
  descendente?: boolean;
}

export interface DuplicarPlatoDto {
  nombre?: string | null;
}

export interface DuplicarMenuAsignadoDto {
  nombre?: string | null;
  pacienteId?: Guid | null;
}

/* ==================== COBROS / FACTURACIÓN ==================== */

export type MetodoPago = 'Efectivo' | 'TarjetaDebito' | 'TarjetaCredito' | 'Transferencia' | 'QR' | 'Otro';

export type EstadoPago = 'Pagado' | 'Anulado';

/** Un pago por consulta (cerrada); se anula y se puede volver a cobrar. */
export interface Pago {
  id: Guid;
  consultaId: Guid;
  pacienteId: Guid;
  pacienteNombre: string;
  monto: number;
  moneda: string;
  metodoPago: MetodoPago;
  estado: EstadoPago;
  /** "REC-2026-12". */
  numeroRecibo: string;
  fechaPago: DateTimeString;
  notas: string | null;
  fechaCreacion: DateTimeString;
}

export interface CrearPagoDto {
  consultaId: Guid;
  monto: number;
  metodoPago: MetodoPago;
  notas?: string | null;
}

export interface PagoFiltro {
  pacienteId?: Guid;
  consultaId?: Guid;
  estado?: EstadoPago;
  metodoPago?: MetodoPago;
  fechaInicio?: DateTimeString;
  fechaFin?: DateTimeString;
}

export type AgrupacionReporte = 'Dia' | 'Semana' | 'Mes';

export interface PuntoIngresos {
  /** Primer dia del tramo, en fecha de calendario. */
  clave: string;
  total: number;
  cobros: number;
}

export interface ReporteIngresos {
  desde: DateTimeString;
  hasta: DateTimeString;
  agrupacion: AgrupacionReporte;
  total: number;
  cobros: number;
  ticketPromedio: number;
  anulados: number;
  montoAnulado: number;
  consultasAtendidas: number;
  consultasPorCobrar: number;
  /** Periodo anterior de la misma duracion. */
  totalAnterior: number;
  cobrosAnterior: number;
  serie: PuntoIngresos[];
  porMetodo: { metodo: MetodoPago; total: number; cobros: number }[];
  porNutricionista: { nutricionistaId: Guid; nombre: string; total: number; cobros: number }[];
  porTipoConsulta: { tipo: TipoConsulta; total: number; cobros: number }[];
}

export type TipoPersona = 'Fisica' | 'Moral';

/** El nombre viaja por JSON; la clave SAT (601, 612…) es el valor numérico del enum. */
export type RegimenFiscal =
  | 'GeneralDeLeyPersonasMorales'
  | 'PersonasMoralesConFinesNoLucrativos'
  | 'SueldosYSalarios'
  | 'Arrendamiento'
  | 'EnajenacionOAdquisicionDeBienes'
  | 'DemasIngresos'
  | 'ResidentesEnElExtranjero'
  | 'IngresosPorDividendos'
  | 'ActividadesEmpresarialesYProfesionales'
  | 'IngresosPorIntereses'
  | 'IngresosPorObtencionDePremios'
  | 'SinObligacionesFiscales'
  | 'IncorporacionFiscal'
  | 'ActividadesAgricolasGanaderas'
  | 'OpcionalParaGruposDeSociedades'
  | 'Coordinados'
  | 'PlataformasTecnologicas'
  | 'RegimenSimplificadoDeConfianza';

export type UsoCfdi =
  | 'G01' | 'G02' | 'G03'
  | 'I01' | 'I02' | 'I03' | 'I04' | 'I05' | 'I06' | 'I07' | 'I08'
  | 'D01' | 'D02' | 'D03' | 'D04' | 'D06' | 'D07' | 'D08' | 'D09' | 'D10'
  | 'S01' | 'CP01' | 'CN01';

export type EstatusFactura = 'Borrador' | 'Emitida' | 'Anulada';

export interface Factura {
  id: Guid;
  pagoId: Guid;
  tipoPersona: TipoPersona;
  rfc: string;
  nombreRazonSocial: string;
  regimenFiscal: RegimenFiscal;
  usoCfdi: UsoCfdi;
  codigoPostal: string;
  serie: string;
  folio: number;
  fechaEmision: DateTimeString;
  uuid: string | null;
  subtotal: number;
  tarifaIva: number;
  iva: number;
  total: number;
  estatus: EstatusFactura;
  fechaCreacion: DateTimeString;
}

/** Datos del receptor; el pago va en la URL (POST /api/pagos/{id}/factura). */
export interface DatosFiscalesReceptor {
  tipoPersona: TipoPersona;
  rfc: string;
  razonSocial: string;
  regimenFiscal: RegimenFiscal;
  usoCfdi: UsoCfdi;
  codigoPostal: string;
}

export interface FacturaFiltro {
  estatus?: EstatusFactura;
  rfc?: string;
  pacienteId?: Guid;
  fechaInicio?: DateTimeString;
  fechaFin?: DateTimeString;
}

export interface DatosFiscalesClinica {
  id: Guid;
  razonSocial: string;
  rfc: string;
  regimenFiscal: RegimenFiscal;
  codigoPostal: string;
  direccion: string;
  telefono: string | null;
  correo: string | null;
  logoUrl: string | null;
  serie: string;
  tarifaIva: number;
  fechaActualizacion: DateTimeString;
}

export type ActualizarDatosFiscalesClinicaDto = Omit<DatosFiscalesClinica, 'id' | 'fechaActualizacion'>;

/* ---------- Reservacion en linea (publica) ---------- */

export interface ClinicaPublica {
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
}

export interface ProfesionalPublico {
  id: Guid;
  nombre: string;
  especialidad: string | null;
  duracionMinutos: number;
}

export interface OpcionesReserva {
  clinica: ClinicaPublica;
  profesionales: ProfesionalPublico[];
  /** Horario general de la clinica (pagina de inicio). */
  horarioClinica: BloqueHorario[];
  anticipacionHoras: number;
  diasMaximos: number;
}

export interface HoraPublica {
  inicio: DateTimeString;
  /** "HH:mm" en hora de la clinica. */
  hora: string;
}

export interface DiaPublico {
  fecha: DateOnlyString;
  horas: HoraPublica[];
}

export interface CrearReservaDto {
  nutricionistaId: Guid | null;
  inicio: DateTimeString;
  nombreCompleto: string;
  telefono: string;
  correoElectronico: string;
  sexo: Sexo;
  motivo?: string | null;
  /** Campo trampa para bots: siempre vacio. */
  sitio?: string;
}

export interface ReservaConfirmada {
  fechaInicio: DateTimeString;
  fechaFin: DateTimeString;
  nutricionistaNombre: string;
  clinica: ClinicaPublica;
}
