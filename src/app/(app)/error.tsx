"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Captura los errores de las pantallas de la app sin tumbar toda la navegación. */
export default function AppError({ error, reset }: AppErrorProps) {
  return (
    <EmptyState
      icon={TriangleAlert}
      title="Algo ha salido mal"
      description={error.message || "Se ha producido un error inesperado."}
      action={<Button onClick={reset}>Reintentar</Button>}
    />
  );
}
