import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import { router } from "@/app/router";
import { ApiError } from "@/lib/api-error";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { ThemeProvider, useTheme } from "@/hooks/use-theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (intentos, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return intentos < 2;
      },
    },
  },
});

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
