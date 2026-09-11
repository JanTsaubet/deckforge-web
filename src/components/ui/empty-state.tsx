import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

/** Estado vacío reutilizable: listas sin resultados, biblioteca sin mazos, etc. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-surface-raised text-accent">
        <Icon className="size-6" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-balance text-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
