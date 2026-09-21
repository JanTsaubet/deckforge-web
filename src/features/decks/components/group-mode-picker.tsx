"use client";

import { cn } from "@/lib/utils/cn";
import { GROUP_MODE_LABELS, GROUP_MODES, type GroupMode } from "../lib/deck-lines";

interface GroupModePickerProps {
  value: GroupMode;
  onChange: (mode: GroupMode) => void;
  className?: string;
}

/** Tipo, coste, color o etiqueta: cómo se agrupa el mazo principal. */
export function GroupModePicker({ value, onChange, className }: GroupModePickerProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <span className="text-muted">Agrupar por</span>
      <div
        role="radiogroup"
        aria-label="Agrupar por"
        className="flex rounded-md border border-border p-0.5"
      >
        {GROUP_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={value === mode}
            onClick={() => onChange(mode)}
            className={cn(
              "rounded px-2 py-0.5 transition-colors duration-150",
              value === mode
                ? "bg-surface-raised text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            {GROUP_MODE_LABELS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
}
