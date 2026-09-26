import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
  Stethoscope,
  UtensilsCrossed,
  Users,
} from "lucide-react";

export interface ModuloNav {
  label: string;
  href: string;
  icon: LucideIcon;
  activo: boolean;
  descripcion: string;
}

export const MODULOS_NAV: ModuloNav[] = [
  {
    label: "Resumen",
    href: "/",
    icon: LayoutDashboard,
    activo: false,
    descripcion: "Panel con indicadores del dia",
  },
  {
    label: "Pacientes",
    href: "/pacientes",
    icon: Users,
    activo: true,
    descripcion: "Listado y expediente clinico",
  },
  {
    label: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
    activo: false,
    descripcion: "Citas por dia y traslados",
  },
  {
    label: "Consultas",
    href: "/consultas",
    icon: ClipboardList,
    activo: false,
    descripcion: "Atenciones clinicas en curso",
  },
  {
    label: "Nutricionistas",
    href: "/nutricionistas",
    icon: Stethoscope,
    activo: false,
    descripcion: "Equipo clinico",
  },
  {
    label: "Planes",
    href: "/planes",
    icon: UtensilsCrossed,
    activo: false,
    descripcion: "Planes alimenticios y menues",
  },
];
