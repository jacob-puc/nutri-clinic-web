import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Stethoscope,
  UtensilsCrossed,
  Users,
  Wallet,
} from "lucide-react";

export type GrupoNav = "hoy" | "clinica" | "gestion" | "pie";

export interface ModuloNav {
  label: string;
  href: string;
  icon: LucideIcon;
  activo: boolean;
  descripcion: string;
  /** Solo los activos: "hoy" es el flujo del dia, "clinica" lo de consulta y armado; "pie" va fijo sobre el perfil. */
  grupo?: GrupoNav;
}

/** Rutas que el rol de la sesion no puede abrir; las calcula la capa de features. */
export type ModulosOcultos = ReadonlySet<string>;

/**
 * Dato vivo junto a un modulo (citas que quedan, consultas abiertas, cobros
 * pendientes). Lo calcula la capa de features y llega por props, para que
 * los componentes de layout no dependan de ella.
 */
export interface InsigniaNav {
  valor: number;
  tono: "marca" | "aviso";
  /** Punto que late: algo esta ocurriendo ahora (consulta en curso). */
  pulso?: boolean;
  descripcion: string;
}

export type InsigniasNav = Partial<Record<string, InsigniaNav>>;

export const MODULOS_NAV: ModuloNav[] = [
  {
    label: "Resumen",
    href: "/panel",
    icon: LayoutDashboard,
    activo: true,
    descripcion: "Cómo va el día: citas, consultas, cobros y seguimiento",
    grupo: "hoy",
  },
  {
    label: "Pacientes",
    href: "/pacientes",
    icon: Users,
    activo: true,
    descripcion: "Listado y expediente clínico",
    grupo: "clinica",
  },
  {
    label: "Citas",
    href: "/citas",
    icon: CalendarDays,
    activo: true,
    descripcion: "Citas por día y traslados",
    grupo: "hoy",
  },
  {
    label: "Consultas",
    href: "/consultas",
    icon: ClipboardList,
    activo: true,
    descripcion: "Atenciones clínicas en curso",
    grupo: "hoy",
  },
  {
    label: "Equipo",
    href: "/nutricionistas",
    icon: Stethoscope,
    activo: true,
    descripcion: "Nutricionistas, recepción y sus accesos",
    grupo: "gestion",
  },
  {
    label: "Planes",
    href: "/planes",
    icon: UtensilsCrossed,
    activo: true,
    descripcion: "Platos, plantillas semanales y planes de pacientes",
    grupo: "clinica",
  },
  {
    label: "Cobros",
    href: "/cobros",
    icon: Wallet,
    activo: true,
    descripcion: "Cobros pendientes, cortes y facturas",
    grupo: "hoy",
  },
  {
    label: "Reportes",
    href: "/reportes",
    icon: BarChart3,
    activo: true,
    descripcion: "Ingresos de la clínica por periodo",
    grupo: "gestion",
  },
  {
    label: "Configuración",
    href: "/configuracion",
    icon: Settings,
    activo: true,
    descripcion: "Datos fiscales y horario de la clínica",
    grupo: "pie",
  },
];
