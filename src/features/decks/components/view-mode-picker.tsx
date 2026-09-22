"use client";

import { Images, LayoutList, List } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Cómo se ven las cartas: en texto, en imágenes sueltas o apiladas por grupo. */
export const VIEW_MODES = ["text", "gallery", "stacks"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  text: "Texto",
  gallery: "Imágenes",
  stacks: "Pilas",
};

const VIEW_MODE_ICONS: Record<ViewMode, typeof List> = {
  text: List,
  gallery: Images,
  stacks: LayoutList,
};

interface ViewModePickerProps {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
  /** Vistas disponibles aquí; por defecto, todas. */
  modes?: readonly ViewMode[];
  className?: string;
}

export function ViewModePicker({
  value,
  onChange,
  modes = VIEW_MODES,
  className,
}: ViewModePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Cómo ver las cartas"
      className={cn("flex rounded-md border border-border p-0.5 text-xs", className)}
    >
      {modes.map((mode) => {
        const Icon = VIEW_MODE_ICONS[mode];
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={value === mode}
            onClick={() => onChange(mode)}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-1 transition-colors duration-150",
              value === mode
                ? "bg-surface-raised text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {VIEW_MODE_LABELS[mode]}
          </button>
        );
      })}
    </div>
  );
}
