import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  /** Estado del drawer movil, independiente del colapso de escritorio. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => setCollapsed((v) => !v), []);

  return (
    <SidebarContext.Provider
      value={{ collapsed, toggle, mobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const contexto = useContext(SidebarContext);
  if (!contexto) {
    throw new Error("useSidebar debe usarse dentro de <SidebarProvider>.");
  }
  return contexto;
}
