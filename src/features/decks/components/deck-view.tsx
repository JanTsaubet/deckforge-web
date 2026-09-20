"use client";

import { Images, Layers, List } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { CardPreview } from "@/features/cards/components/card-preview";
import { cn } from "@/lib/utils/cn";
import { DECK_BOARD_LABELS } from "../constants/deck-formats";
import { CARD_CATEGORY_LABELS } from "../lib/card-category";
import { countCopies, groupByBoard, groupByCategory } from "../lib/deck-lines";
import { computeDeckStats } from "../lib/deck-stats";
import { validateDeck } from "../lib/deck-validation";
import type { CatalogCard, DeckCardLine, DeckFormat } from "../types/deck";
import { DeckIssues } from "./deck-issues";
import { DeckStatsPanel } from "./deck-stats-panel";
import { DeckViewGallery } from "./deck-view-gallery";
import { DeckViewList } from "./deck-view-list";

interface DeckViewProps {
  lines: DeckCardLine[];
  format: DeckFormat;
  /** Cartas guardadas en el mazo que el catálogo aún no conoce: no se pueden mostrar. */
  unknownCards?: number;
}

type ViewMode = "text" | "gallery";

const VIEW_MODES: Array<{ id: ViewMode; label: string; icon: typeof List }> = [
  { id: "text", label: "Texto", icon: List },
  { id: "gallery", label: "Imágenes", icon: Images },
];

/**
 * Pantalla 6 · Un mazo en modo lectura: las cartas por zonas, el análisis y la legalidad.
 *
 * Es la misma información que ve su dueño en el editor, calculada con los mismos módulos,
 * pero sin nada que se pueda tocar: aquí puede entrar cualquiera con el enlace.
 */
export function DeckView({ lines, format, unknownCards = 0 }: DeckViewProps) {
  const [view, setView] = useState<ViewMode>("text");
  const [previewCard, setPreviewCard] = useState<CatalogCard>();

  const boards = useMemo(() => groupByBoard(lines), [lines]);
  const mainGroups = useMemo(() => groupByCategory(boards.main), [boards.main]);
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
          <div
            role="radiogroup"
            aria-label="Cómo ver las cartas"
            className="flex rounded-md border border-border p-0.5 text-xs"
          >
            {VIEW_MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={view === id}
                onClick={() => setView(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2 py-1 transition-colors duration-150",
                  view === id
                    ? "bg-surface-raised text-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </button>
            ))}
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
            {mainGroups.map(({ category, lines: group }) => (
              <section key={category} aria-label={CARD_CATEGORY_LABELS[category]}>
                <h4 className="mb-1 px-2 text-xs font-medium text-muted">
                  {CARD_CATEGORY_LABELS[category]} ({countCopies(group)})
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
