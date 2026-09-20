"use client";

import { Crown } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { DECK_BOARD_LABELS } from "@/features/decks/constants/deck-formats";
import { CARD_CATEGORY_LABELS } from "@/features/decks/lib/card-category";
import { countCopies, groupByBoard, groupByCategory } from "@/features/decks/lib/deck-lines";
import type { DeckCardLine } from "@/features/decks/types/deck";
import { useDeckEditor } from "../store/deck-editor-context";
import { DeckListRow } from "./deck-list-row";

interface DeckListProps {
  hasCommander: boolean;
  /** Cartas con algún problema de legalidad, para resaltarlas. */
  flaggedCardIds: Set<string>;
}

/**
 * El mazo por zonas. El mazo principal se agrupa por tipo de carta (criaturas, instantáneos…,
 * y las tierras al final); dentro de cada grupo, por nombre. Las zonas vacías del banquillo y
 * las "quizás" no se muestran.
 */
export function DeckList({ hasCommander, flaggedCardIds }: DeckListProps) {
  const entries = useDeckEditor((state) => state.entries);

  const boards = useMemo(() => groupByBoard(entries), [entries]);
  const groups = useMemo(() => groupByCategory(boards.main), [boards.main]);

  const rows = (lines: DeckCardLine[]) => (
    <ul className="flex flex-col">
      <AnimatePresence initial={false}>
        {lines.map((entry) => (
          <DeckListRow
            key={`${entry.board}:${entry.card.id}`}
            entry={entry}
            hasCommander={hasCommander}
            flagged={flaggedCardIds.has(entry.card.id)}
          />
        ))}
      </AnimatePresence>
    </ul>
  );

  return (
    <div className="flex flex-col gap-6">
      {hasCommander && (
        <Zone title={DECK_BOARD_LABELS.commander} count={countCopies(boards.commander)}>
          {boards.commander.length > 0 ? (
            rows(boards.commander)
          ) : (
            <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted">
              <Crown className="size-4 shrink-0 text-accent" aria-hidden />
              Busca una criatura legendaria y pulsa la corona para hacerla comandante.
            </p>
          )}
        </Zone>
      )}

      <Zone title={DECK_BOARD_LABELS.main} count={countCopies(boards.main)}>
        {groups.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted">
            El mazo está vacío. Añade cartas con el buscador: por ejemplo, «4 Lightning Bolt».
          </p>
        ) : (
          <div className="grid gap-x-6 gap-y-4 xl:grid-cols-2">
            {groups.map(({ category, lines }) => (
              <section key={category} aria-label={CARD_CATEGORY_LABELS[category]}>
                <h4 className="mb-1 px-2 text-xs font-medium text-muted">
                  {CARD_CATEGORY_LABELS[category]} ({countCopies(lines)})
                </h4>
                {rows(lines)}
              </section>
            ))}
          </div>
        )}
      </Zone>

      {(["sideboard", "maybeboard"] as const).map(
        (board) =>
          boards[board].length > 0 && (
            <Zone key={board} title={DECK_BOARD_LABELS[board]} count={countCopies(boards[board])}>
              {rows(boards[board])}
            </Zone>
          ),
      )}
    </div>
  );
}

function Zone({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title}>
      <h3 className="mb-2 flex items-baseline gap-2 border-b border-border pb-1 text-sm font-semibold">
        {title}
        <span className="text-xs font-normal text-muted tabular-nums">{count}</span>
      </h3>
      {children}
    </section>
  );
}
