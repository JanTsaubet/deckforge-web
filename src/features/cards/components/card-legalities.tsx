import { cn } from "@/lib/utils/cn";
import { FORMAT_LABELS, LEGALITY_FORMATS, LEGALITY_LABELS } from "../constants/card-labels";
import type { Legality } from "../types/card";

const STATE_CLASSES: Record<Legality, string> = {
  legal: "bg-mana-g/20 text-mana-g",
  not_legal: "bg-surface-raised text-muted",
  restricted: "bg-mana-w/20 text-mana-w",
  banned: "bg-danger/20 text-danger",
};

interface CardLegalitiesProps {
  legalities: Record<string, Legality>;
}

/** Tabla de legalidad de la carta por formato. */
export function CardLegalities({ legalities }: CardLegalitiesProps) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {LEGALITY_FORMATS.map((format) => {
        const state = legalities[format] ?? "not_legal";

        return (
          <li
            key={format}
            className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-xs"
          >
            <span className="text-muted">{FORMAT_LABELS[format]}</span>
            <span className={cn("rounded-full px-2 py-0.5 font-medium", STATE_CLASSES[state])}>
              {LEGALITY_LABELS[state]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
