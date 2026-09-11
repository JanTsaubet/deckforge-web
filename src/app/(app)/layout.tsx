import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";

/**
 * Shell de la aplicación. La cabecera vive en el layout (no se desmonta al navegar),
 * lo que permite animar el indicador de la navegación entre rutas.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
