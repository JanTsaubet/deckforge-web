"use client";

import { Layers } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { CardPreview } from "@/features/cards/components/card-preview";
import { cn } from "@/lib/utils/cn";
import { DECK_BOARD_LABELS } from "../constants/deck-formats";
import { useGroupMode } from "../hooks/use-group-mode";
import { useViewMode } from "../hooks/use-view-mode";
import { countCopies, groupByBoard, groupLines } from "../lib/deck-lines";
import { computeDeckStats } from "../lib/deck-stats";
import { validateDeck } from "../lib/deck-validation";
import type { CatalogCard, DeckCardLine, DeckFormat } from "../types/deck";
import { DeckIssues } from "./deck-issues";
import { DeckStatsPanel } from "./deck-stats-panel";
import { DeckViewGallery } from "./deck-view-gallery";
import { DeckViewList } from "./deck-view-list";
import { GroupModePicker } from "./group-mode-picker";
import { ViewModePicker } from "./view-mode-picker";

interface DeckViewProps {
  lines: DeckCardLine[];
  format: DeckFormat;
  /** Cartas guardadas en el mazo que el catálogo aún no conoce: no se pueden mostrar. */
  unknownCards?: number;
}

/** En modo lectura no hay pilas: sin nada que arrastrar, no aportan sobre las imágenes. */
const READING_VIEWS = ["text", "gallery"] as const;

/**
 * Pantalla 6 · Un mazo en modo lectura: las cartas por zonas, el análisis y la legalidad.
 *
 * Es la misma información que ve su dueño en el editor, calculada con los mismos módulos,
 * pero sin nada que se pueda tocar: aquí puede entrar cualquiera con el enlace.
 */
export function DeckView({ lines, format, unknownCards = 0 }: DeckViewProps) {
  const [view, setView] = useViewMode("deckforge:vista-mazo", READING_VIEWS);
  const [previewCard, setPreviewCard] = useState<CatalogCard>();
  const [groupMode, setGroupMode] = useGroupMode();

  const boards = useMemo(() => groupByBoard(lines), [lines]);
  const mainGroups = useMemo(() => groupLines(boards.main, groupMode), [boards.main, groupMode]);
  const stats = useMemo(() => computeDeckStats(lines), [lines]);
  const issues = useMemo(() => validateDeck(lines, format), [lines, format]);

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="Este mazo todavía no tiene cartas"
        description="Cuando su autor añada la primera, aparecerá aquí con sus estadísticas."
      />
    );
  }

  /** Una zona (o un grupo de tipos) en la vista elegida. */
  const cards = (list: DeckCardLine[], priority = false) =>
    view === "gallery" ? (
      <DeckViewGallery lines={list} priority={priority} />
    ) : (
      <DeckViewList lines={list} onPreview={setPreviewCard} />
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            {stats.playable} {stats.playable === 1 ? "carta" : "cartas"}
            {unknownCards > 0 && (
              <>
                {" · "}
                <span title="Se añadieron antes de la última actualización del catálogo.">
                  {unknownCards} sin datos
                </span>
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <GroupModePicker value={groupMode} onChange={setGroupMode} />
            <ViewModePicker value={view} onChange={setView} modes={READING_VIEWS} />
          </div>
        </div>

        {boards.commander.length > 0 && (
          <Zone title={DECK_BOARD_LABELS.commander} count={countCopies(boards.commander)}>
            {cards(boards.commander, true)}
          </Zone>
        )}

        <Zone title={DECK_BOARD_LABELS.main} count={countCopies(boards.main)}>
          <div
            className={cn(
              "flex flex-col gap-4",
              // En texto caben dos columnas de tipos; en imágenes, cada grupo ocupa el ancho.
              view === "text" && "grid gap-x-6 xl:grid-cols-2",
            )}
          >
            {mainGroups.map(({ key, label, lines: group }) => (
              <section key={key} aria-label={label}>
                <h4 className="mb-1 px-2 text-xs font-medium text-muted">
                  {label} ({countCopies(group)})
                </h4>
                {cards(group, boards.commander.length === 0)}
              </section>
            ))}
          </div>
        </Zone>

        {(["sideboard", "maybeboard"] as const).map(
          (board) =>
            boards[board].length > 0 && (
              <Zone key={board} title={DECK_BOARD_LABELS[board]} count={countCopies(boards[board])}>
                {cards(boards[board])}
              </Zone>
            ),
        )}
      </div>

      <aside
        aria-label="Análisis del mazo"
        className="flex flex-col gap-5 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto"
      >
        {view === "text" && (
          <CardPreview
            card={previewCard}
            hint="Pasa el ratón por una carta de la lista para verla."
            className="hidden lg:block"
          />
        )}
        <DeckIssues issues={issues} okMessage="El mazo cumple las reglas de su formato." />
        <DeckStatsPanel stats={stats} />
      </aside>
    </div>
  );
}

function Zone({ title, count, children }: { title: string; count: number; children: ReactNode }) {
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
