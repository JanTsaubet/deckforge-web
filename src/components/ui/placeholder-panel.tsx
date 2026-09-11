import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface PlaceholderPanelProps {
  title: string;
  /** Fase del roadmap (ver README) en la que se implementa este bloque. */
  phase: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Zona reservada del layout para una funcionalidad aún no implementada.
 * Permite validar la estructura de cada pantalla antes de construir su contenido.
 */
export function PlaceholderPanel({
  title,
  phase,
  description,
  className,
  children,
}: PlaceholderPanelProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-dashed border-border bg-surface/60 p-5",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="shrink-0 rounded-full bg-surface-raised px-2 py-0.5 font-mono text-[11px] text-muted">
          {phase}
        </span>
      </header>
      {description && <p className="text-sm text-pretty text-muted">{description}</p>}
      {children}
    </section>
  );
}
