import { useSidebar } from "@/components/layout/sidebar-context";
import { SidebarNav, SidebarPie } from "@/components/layout/sidebar-nav";
import { MarcaSidebar } from "@/components/layout/sidebar";
import type { InsigniasNav, ModulosOcultos } from "@/components/layout/nav-items";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function SidebarMobile({ insignias, ocultos }: { insignias?: InsigniasNav; ocultos?: ModulosOcultos }) {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent
        side="left"
        className="sidebar-surface text-sidebar-foreground w-72 border-r-0 p-0 [&>button]:bg-transparent! [&>button]:text-sidebar-muted-foreground [&>button:hover]:text-sidebar-foreground"
      >
        <SheetHeader className="border-sidebar-border border-b px-4 py-4 text-left">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SheetDescription className="sr-only">
            Navega entre los módulos de NutriClinica
          </SheetDescription>
          <MarcaSidebar />
        </SheetHeader>
        <div className="flex flex-1 flex-col px-3 py-5">
          {/* El drawer nunca se pliega: siempre muestra los labels. */}
          <SidebarNav collapsed={false} insignias={insignias} ocultos={ocultos} onNavigate={() => setMobileOpen(false)} />
          <SidebarPie collapsed={false} ocultos={ocultos} onNavigate={() => setMobileOpen(false)} className="pt-4" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
