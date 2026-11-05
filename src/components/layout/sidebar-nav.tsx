import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import type { GrupoNav, InsigniaNav, InsigniasNav, ModuloNav, ModulosOcultos } from "@/components/layout/nav-items";
import { MODULOS_NAV } from "@/components/layout/nav-items";
import { TooltipSimple } from "@/components/ui/tooltip-simple";

interface SidebarNavProps {
  collapsed: boolean;
  onNavigate?: () => void;
  insignias?: InsigniasNav;
  ocultos?: ModulosOcultos;
}

/* Agrupados por como se usan: "Hoy" es el recorrido del dia (agenda, atender,
   cobrar) y "Clinica" lo que se consulta o se arma con calma. */
const GRUPOS: { grupo: GrupoNav; etiqueta: string }[] = [
  { grupo: "hoy", etiqueta: "Hoy" },
  { grupo: "clinica", etiqueta: "Clínica" },
  { grupo: "gestion", etiqueta: "Administración" },
];
const SIN_OCULTOS: ModulosOcultos = new Set();
const MODULOS_PROXIMOS = MODULOS_NAV.filter((modulo) => !modulo.activo);

/* Base comun de los items: misma altura y radio para activos y proximos,
   asi la rejilla del menu no salta entre un grupo y otro. */
const BASE_ITEM = cn(
  "group/item relative flex h-10 items-center gap-3 rounded-lg px-1.5 text-sm font-medium outline-none",
  "transition-[background-color,color,box-shadow] duration-200 ease-(--ease-out-soft)",
  "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
);

/* El estado activo se pinta con `aria-current="page"`, que NavLink ya pone
   solo. No se usa la forma de funcion de `className`: dentro del Tooltip el
   Slot de Radix concatena className como texto y la funcion se perderia. */
const ITEM_ENLACE = cn(
  BASE_ITEM,
  "text-sidebar-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground active:bg-sidebar-pressed",
  "aria-[current=page]:sidebar-item-active aria-[current=page]:text-sidebar-accent-foreground aria-[current=page]:font-semibold",
);

const TONO_INSIGNIA: Record<InsigniaNav["tono"], string> = {
  marca: "bg-sidebar-primary text-sidebar-primary-foreground",
  aviso: "bg-[var(--warning)] text-[oklch(0.25_0.05_70)]",
};

function TejaIcono({ modulo, insignia, collapsed }: { modulo: ModuloNav; insignia?: InsigniaNav; collapsed: boolean }) {
  const Icon = modulo.icon;

  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-7 shrink-0 place-items-center rounded-md transition-[background-color,color,box-shadow] duration-200",
        "group-hover/item:bg-sidebar-hover group-hover/item:text-sidebar-foreground",
        "group-aria-[current=page]/item:sidebar-icon-active",
      )}
    >
      <Icon className="size-[18px]" />
      {/* Plegado no cabe el numero: queda un punto sobre el icono. */}
      {collapsed && insignia && (
        <span
          className={cn(
            "ring-sidebar absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2",
            TONO_INSIGNIA[insignia.tono],
            insignia.pulso && "motion-safe:animate-pulse",
          )}
        />
      )}
    </span>
  );
}

function Insignia({ insignia }: { insignia: InsigniaNav }) {
  return (
    <span className="flex items-center gap-1.5">
      {insignia.pulso && (
        <span className="relative flex size-2" aria-hidden>
          <span className="bg-sidebar-primary absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none" />
          <span className="bg-sidebar-primary relative inline-flex size-2 rounded-full" />
        </span>
      )}
      <span
        className={cn(
          "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
          TONO_INSIGNIA[insignia.tono],
        )}
      >
        {insignia.valor > 99 ? "99+" : insignia.valor}
      </span>
    </span>
  );
}

function SidebarLink({
  modulo,
  collapsed,
  insignia,
  onNavigate,
}: {
  modulo: ModuloNav;
  collapsed: boolean;
  insignia?: InsigniaNav;
  onNavigate?: () => void;
}) {
  const etiquetaAccesible = insignia ? `${modulo.label}: ${insignia.descripcion}` : modulo.label;

  const enlace = (
    <NavLink
      to={modulo.href}
      /* "/" solo se marca en el Resumen, no en cada ruta que empieza con "/". */
      end={modulo.href === "/panel"}
      onClick={onNavigate}
      aria-label={collapsed || insignia ? etiquetaAccesible : undefined}
      className={cn(ITEM_ENLACE, collapsed && "justify-center")}
    >
      {/* Marca de seccion activa pegada al borde del panel: refuerza el
          estado sin depender solo del color. */}
      <span
        aria-hidden
        className={cn(
          "bg-sidebar-primary absolute top-1/2 h-2 w-[3px] -translate-y-1/2 rounded-r-full opacity-0",
          "shadow-[0_0_10px_1px_var(--sidebar-glow)] transition-[opacity,height] duration-200",
          "group-aria-[current=page]/item:h-5 group-aria-[current=page]/item:opacity-100",
          collapsed ? "-left-2" : "-left-3",
        )}
      />
      <TejaIcono modulo={modulo} insignia={insignia} collapsed={collapsed} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{modulo.label}</span>
          {insignia && <Insignia insignia={insignia} />}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return enlace;

  return (
    <TooltipSimple
      side="right"
      contenido={
        insignia ? (
          <>
            <p className="font-medium">{modulo.label}</p>
            <p className="text-xs opacity-75">{insignia.descripcion}</p>
          </>
        ) : (
          modulo.label
        )
      }
    >
      {enlace}
    </TooltipSimple>
  );
}

function SidebarProximo({ modulo, collapsed }: { modulo: ModuloNav; collapsed: boolean }) {
  return (
    <TooltipSimple
      side="right"
      contenido={
        <>
          <p className="font-medium">{modulo.label}</p>
          <p className="text-xs opacity-75">{modulo.descripcion}</p>
        </>
      }
    >
      <div
        aria-disabled="true"
        tabIndex={0}
        className={cn(
          BASE_ITEM,
          "text-sidebar-muted-foreground h-9 cursor-not-allowed opacity-50",
          collapsed && "justify-center",
        )}
      >
        <TejaIcono modulo={modulo} collapsed={collapsed} />
        {!collapsed && <span className="flex-1 truncate">{modulo.label}</span>}
      </div>
    </TooltipSimple>
  );
}

function EtiquetaGrupo({ children }: { children: string }) {
  return (
    <p className="text-sidebar-muted-foreground/80 px-2 pb-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
      {children}
    </p>
  );
}

/** Enlaces fijos al pie del menu, fuera del scroll: siempre a la vista sobre el perfil. */
export function SidebarPie({
  collapsed,
  onNavigate,
  ocultos = SIN_OCULTOS,
  className,
}: Pick<SidebarNavProps, "collapsed" | "onNavigate" | "ocultos"> & { className?: string }) {
  const modulos = MODULOS_NAV.filter((m) => m.activo && m.grupo === "pie" && !ocultos.has(m.href));
  if (modulos.length === 0) return null;

  return (
    <nav aria-label="Ajustes" className={cn("flex shrink-0 flex-col gap-1", className)}>
      {modulos.map((modulo) => (
        <SidebarLink key={modulo.href} modulo={modulo} collapsed={collapsed} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

export function SidebarNav({ collapsed, onNavigate, insignias = {}, ocultos = SIN_OCULTOS }: SidebarNavProps) {
  const grupos = GRUPOS.map((g) => ({
    ...g,
    modulos: MODULOS_NAV.filter((m) => m.activo && m.grupo === g.grupo && !ocultos.has(m.href)),
  })).filter((g) => g.modulos.length > 0);

  return (
    <nav aria-label="Navegación principal" className="flex flex-1 flex-col">
      {grupos.map(({ grupo, etiqueta, modulos }, i) => (
        <div
          key={grupo}
          className={cn(
            "flex flex-col gap-1",
            i > 0 && (collapsed ? "border-sidebar-border mt-3 border-t pt-3" : "mt-6"),
          )}
        >
          {!collapsed && <EtiquetaGrupo>{etiqueta}</EtiquetaGrupo>}
          {modulos.map((modulo) => (
            <SidebarLink
              key={modulo.href}
              modulo={modulo}
              collapsed={collapsed}
              insignia={insignias[modulo.href]}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}

      {/* Los modulos sin construir van al fondo y mas tenues: el agrupamiento
          ya dice que todavia no se pueden usar. */}
      {MODULOS_PROXIMOS.length > 0 && (
        <div
          className={cn(
            "mt-auto flex flex-col gap-0.5 pt-6",
            collapsed && "border-sidebar-border border-t pt-3",
          )}
        >
          {!collapsed && <EtiquetaGrupo>Próximamente</EtiquetaGrupo>}
          {MODULOS_PROXIMOS.map((modulo) => (
            <SidebarProximo key={modulo.href} modulo={modulo} collapsed={collapsed} />
          ))}
        </div>
      )}
    </nav>
  );
}
