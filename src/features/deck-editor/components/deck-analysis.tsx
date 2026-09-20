"use client";

import { CardPreview } from "@/features/cards/components/card-preview";
import { DeckIssues } from "@/features/decks/components/deck-issues";
import { DeckStatsPanel } from "@/features/decks/components/deck-stats-panel";
import type { DeckStats } from "@/features/decks/lib/deck-stats";
import type { DeckIssue } from "@/features/decks/lib/deck-validation";
import { useDeckEditor } from "../store/deck-editor-context";

interface DeckAnalysisProps {
  stats: DeckStats;
  issues: DeckIssue[];
}

/** Columna de análisis: la carta bajo el ratón, la validación y las estadísticas en vivo. */
export function DeckAnalysis({ stats, issues }: DeckAnalysisProps) {
  const previewCard = useDeckEditor((state) => state.previewCard);

  return (
    <div className="flex flex-col gap-5">
      <CardPreview card={previewCard} className="hidden lg:block" />
      <DeckIssues issues={issues} />
      <DeckStatsPanel stats={stats} />
    </div>
  );
}
