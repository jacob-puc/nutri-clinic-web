import {
  Activity,
  CalendarHeart,
  ClipboardList,
  HeartPulse,
  LineChart,
  Salad,
  type LucideIcon,
} from "lucide-react";

/*
 * Textos de la pagina publica. Viven aqui (y no en la base de datos) porque
 * cambian poco; para ajustarlos a la clinica real basta con editar este archivo.
 * Lo que si cambia seguido (equipo, horario, telefono, direccion) llega del
 * backend.
 */

export const HERO = {
  etiqueta: "Consulta nutricional profesional",
  titulo: "Come mejor, con un plan hecho para ti",
  descripcion:
    "Te acompañamos con valoración clínica, un plan de alimentación a tu medida y seguimiento consulta a consulta para que veas tu avance.",
  puntos: ["Reserva en línea en 2 minutos", "Plan y menú personalizados", "Seguimiento de tu evolución"],
};

export interface Servicio {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
}

export const SERVICIOS: Servicio[] = [
  {
    icono: ClipboardList,
    titulo: "Consulta inicial",
    descripcion: "Historia clínica, hábitos y objetivos. Partimos de dónde estás hoy para definir a dónde quieres llegar.",
  },
  {
    icono: Activity,
    titulo: "Composición corporal",
    descripcion: "Peso, estatura, IMC, porcentaje de grasa y masa muscular, y medidas de cintura y cadera.",
  },
  {
    icono: Salad,
    titulo: "Plan de alimentación",
    descripcion: "Un menú semanal con platillos que te gustan, adaptado a tus alergias y a tu rutina.",
  },
  {
    icono: HeartPulse,
    titulo: "Nutrición clínica",
    descripcion: "Acompañamiento para diabetes, hipertensión, colesterol alto y otras condiciones de salud.",
  },
  {
    icono: LineChart,
    titulo: "Seguimiento",
    descripcion: "Consultas de control para ajustar el plan y medir tu progreso con gráficas claras.",
  },
  {
    icono: CalendarHeart,
    titulo: "Hábitos sostenibles",
    descripcion: "Cambios realistas que puedas mantener, sin dietas extremas ni prohibiciones innecesarias.",
  },
];

export const PASOS = [
  {
    titulo: "Reserva tu cita",
    descripcion: "Elige profesional, día y hora en línea. Te contactamos para confirmarla.",
  },
  {
    titulo: "Primera consulta",
    descripcion: "Te valoramos, tomamos tus medidas y definimos juntos tus objetivos.",
  },
  {
    titulo: "Tu plan y seguimiento",
    descripcion: "Recibes tu plan de alimentación y en cada control ajustamos según tu avance.",
  },
];
