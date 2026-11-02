import type { MetodoPago, RegimenFiscal, TipoPersona, UsoCfdi } from "@/types/api";

export const METODOS_PAGO: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: "Efectivo", etiqueta: "Efectivo" },
  { valor: "TarjetaDebito", etiqueta: "Débito" },
  { valor: "TarjetaCredito", etiqueta: "Crédito" },
  { valor: "Transferencia", etiqueta: "Transferencia" },
  { valor: "QR", etiqueta: "QR" },
  { valor: "Otro", etiqueta: "Otro" },
];

export const ETIQUETA_METODO = Object.fromEntries(METODOS_PAGO.map((m) => [m.valor, m.etiqueta])) as Record<
  MetodoPago,
  string
>;

/* ---------- Catalogos SAT (CFDI 4.0) ---------- */

type Aplica = TipoPersona | "Ambas";

/** Espejo de CrearFacturaValidator: que regimen admite cada tipo de persona. */
export const REGIMENES: { valor: RegimenFiscal; clave: string; etiqueta: string; aplica: Aplica }[] = [
  { valor: "GeneralDeLeyPersonasMorales", clave: "601", etiqueta: "General de Ley Personas Morales", aplica: "Moral" },
  { valor: "PersonasMoralesConFinesNoLucrativos", clave: "603", etiqueta: "Personas Morales con Fines no Lucrativos", aplica: "Moral" },
  { valor: "SueldosYSalarios", clave: "605", etiqueta: "Sueldos y Salarios e Ingresos Asimilados a Salarios", aplica: "Fisica" },
  { valor: "Arrendamiento", clave: "606", etiqueta: "Arrendamiento", aplica: "Fisica" },
  { valor: "EnajenacionOAdquisicionDeBienes", clave: "607", etiqueta: "Enajenación o Adquisición de Bienes", aplica: "Fisica" },
  { valor: "DemasIngresos", clave: "608", etiqueta: "Demás ingresos", aplica: "Fisica" },
  { valor: "ResidentesEnElExtranjero", clave: "610", etiqueta: "Residentes en el Extranjero sin Establecimiento Permanente en México", aplica: "Ambas" },
  { valor: "IngresosPorDividendos", clave: "611", etiqueta: "Ingresos por Dividendos", aplica: "Fisica" },
  { valor: "ActividadesEmpresarialesYProfesionales", clave: "612", etiqueta: "Personas Físicas con Actividades Empresariales y Profesionales", aplica: "Fisica" },
  { valor: "IngresosPorIntereses", clave: "614", etiqueta: "Ingresos por intereses", aplica: "Fisica" },
  { valor: "IngresosPorObtencionDePremios", clave: "615", etiqueta: "Régimen de los ingresos por obtención de premios", aplica: "Fisica" },
  { valor: "SinObligacionesFiscales", clave: "616", etiqueta: "Sin obligaciones fiscales", aplica: "Fisica" },
  { valor: "IncorporacionFiscal", clave: "621", etiqueta: "Incorporación Fiscal", aplica: "Fisica" },
  { valor: "ActividadesAgricolasGanaderas", clave: "622", etiqueta: "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras", aplica: "Moral" },
  { valor: "OpcionalParaGruposDeSociedades", clave: "623", etiqueta: "Opcional para Grupos de Sociedades", aplica: "Moral" },
  { valor: "Coordinados", clave: "624", etiqueta: "Coordinados", aplica: "Moral" },
  { valor: "PlataformasTecnologicas", clave: "625", etiqueta: "Actividades Empresariales con ingresos a través de Plataformas Tecnológicas", aplica: "Fisica" },
  { valor: "RegimenSimplificadoDeConfianza", clave: "626", etiqueta: "Régimen Simplificado de Confianza", aplica: "Ambas" },
];

export function regimenesPara(tipo: TipoPersona) {
  return REGIMENES.filter((r) => r.aplica === tipo || r.aplica === "Ambas");
}

export const USOS_CFDI: { valor: UsoCfdi; etiqueta: string }[] = [
  { valor: "G01", etiqueta: "Adquisición de mercancías" },
  { valor: "G02", etiqueta: "Devoluciones, descuentos o bonificaciones" },
  { valor: "G03", etiqueta: "Gastos en general" },
  { valor: "I01", etiqueta: "Construcciones" },
  { valor: "I02", etiqueta: "Mobiliario y equipo de oficina por inversiones" },
  { valor: "I03", etiqueta: "Equipo de transporte" },
  { valor: "I04", etiqueta: "Equipo de cómputo y accesorios" },
  { valor: "I05", etiqueta: "Dados, troqueles, moldes, matrices y herramental" },
  { valor: "I06", etiqueta: "Comunicaciones telefónicas" },
  { valor: "I07", etiqueta: "Comunicaciones satelitales" },
  { valor: "I08", etiqueta: "Otra maquinaria y equipo" },
  { valor: "D01", etiqueta: "Honorarios médicos, dentales y gastos hospitalarios" },
  { valor: "D02", etiqueta: "Gastos médicos por incapacidad o discapacidad" },
  { valor: "D03", etiqueta: "Gastos funerales" },
  { valor: "D04", etiqueta: "Donativos" },
  { valor: "D06", etiqueta: "Aportaciones voluntarias al SAR" },
  { valor: "D07", etiqueta: "Primas por seguros de gastos médicos" },
  { valor: "D08", etiqueta: "Gastos de transportación escolar obligatoria" },
  { valor: "D09", etiqueta: "Depósitos en cuentas para el ahorro, primas de pensiones" },
  { valor: "D10", etiqueta: "Pagos por servicios educativos (colegiaturas)" },
  { valor: "S01", etiqueta: "Sin efectos fiscales" },
  { valor: "CP01", etiqueta: "Pagos" },
  { valor: "CN01", etiqueta: "Nómina" },
];

/** Una consulta de nutrición se deduce como honorarios médicos (persona física). */
export const USO_CFDI_SUGERIDO: Record<TipoPersona, UsoCfdi> = { Fisica: "D01", Moral: "G03" };

/** Misma expresion que el backend; la longitud depende del tipo de persona. */
export function validarRfc(rfc: string, tipo: TipoPersona): string | null {
  const limpio = rfc.trim().toUpperCase();
  if (!limpio) return "El RFC es obligatorio.";
  if (!/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(limpio)) return "El RFC no tiene un formato válido.";
  const esperado = tipo === "Moral" ? 12 : 13;
  if (limpio.length !== esperado)
    return `Para persona ${tipo === "Moral" ? "moral" : "física"} el RFC lleva ${esperado} caracteres.`;
  return null;
}

/* ---------- Dinero ---------- */

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function formatearMoneda(valor: number): string {
  return formatoMoneda.format(valor);
}

export const MONTO_MAXIMO = 100_000;
