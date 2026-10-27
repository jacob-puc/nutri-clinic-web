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
    descripcion: "Panel con indicadores del día",
  },
  {
    label: "Pacientes",
    href: "/pacientes",
    icon: Users,
    activo: true,
    descripcion: "Listado y expediente clínico",
  },
  {
    label: "Citas",
    href: "/citas",
    icon: CalendarDays,
    activo: true,
    descripcion: "Citas por día y traslados",
  },
  {
    label: "Consultas",
    href: "/consultas",
    icon: ClipboardList,
    activo: true,
    descripcion: "Atenciones clínicas en curso",
  },
  {
    label: "Nutricionistas",
    href: "/nutricionistas",
    icon: Stethoscope,
    activo: false,
    descripcion: "Equipo clínico",
  },
  {
    label: "Planes",
    href: "/planes",
    icon: UtensilsCrossed,
    activo: false,
    descripcion: "Planes alimenticios y menús",
  },
];
