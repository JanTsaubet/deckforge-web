import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { APP_CONTAINER } from "@/components/layout/container";
import { cn } from "@/lib/utils/cn";

/**
 * Shell de la aplicación. La cabecera vive en el layout (no se desmonta al navegar),
 * lo que permite animar el indicador de la navegación entre rutas.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className={cn(APP_CONTAINER, "py-8")}>{children}</main>
    </>
  );
}
