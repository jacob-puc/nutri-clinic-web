import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import { router } from "@/app/router";
import { ApiError } from "@/lib/api-error";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { ThemeProvider, useTheme } from "@/hooks/use-theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

/**
 * Se crea fuera del componente para que el cliente de react-query no se
 * destruya y se reconstruya en cada render.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (intentos, error) => {
        // Reintentar un 404 o un 400 no cambia el resultado: solo alarga la
        // espera del usuario. Los fallos de red si valen un reintento.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return intentos < 2;
      },
    },
  },
});

/** Los providers se montan aqui para que el toast y los tooltips puedan
 * leer el contexto de tema. */
function Proveedores() {
  useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Radix exige un provider para los tooltips: sin el, cualquier
          <Tooltip> lanza "must be used within TooltipProvider". Se monta
          una sola vez en la app, no en cada sidebar, y con retardo para que
          el tooltip no aparezca al pasar el cursor por encima sin querer. */}
      <TooltipProvider delayDuration={300} skipDelayDuration={200}>
        <SidebarProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors closeButton />
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <Proveedores />
    </ThemeProvider>
  );
}
