"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { useState, type ReactNode } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Los datos de cartas cambian poco: evitamos refetches innecesarios.
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/**
 * Proveedores globales de cliente, agrupados en un único componente para que
 * el layout raíz pueda seguir siendo un Server Component.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  // useState garantiza un QueryClient por navegador, nunca compartido entre usuarios.
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user": respeta la preferencia del sistema "reducir movimiento". */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </QueryClientProvider>
  );
}
