import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Botones de acción alineados a la derecha (crear, importar…). */
  actions?: ReactNode;
}

/** Cabecera estándar de cada pantalla: título, descripción y acciones. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-pretty text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
