import { useSidebar } from "@/components/layout/sidebar-context";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { LogoNutriClinica } from "@/components/layout/logo";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function SidebarMobile() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent
        side="left"
        className="bg-sidebar border-sidebar-border text-sidebar-foreground w-72 border-r p-0"
      >
        <SheetHeader className="border-sidebar-border border-b px-4 py-4 text-left">
          <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
          <SheetDescription className="sr-only">
            Navega entre los modulos de NutriClinica
          </SheetDescription>
          <div className="flex items-center gap-2.5">
            <LogoNutriClinica className="size-9 rounded-lg" />
            <span className="flex flex-col leading-none">
              <span className="text-sidebar-foreground text-base font-bold">
                Nutri<span className="text-sidebar-primary">Clinica</span>
              </span>
              <span className="text-sidebar-muted-foreground mt-0.5 text-[11px] font-medium">
                Consulta nutricional
              </span>
            </span>
          </div>
        </SheetHeader>
        <div className="px-3 py-4">
          {/* El drawer nunca se pliega: siempre muestra los labels. */}
          <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
