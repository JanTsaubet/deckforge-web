"use client";

import { useDndContext, useDroppable } from "@dnd-kit/core";
import { Crown } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useMemo, type ReactNode } from "react";
import { GroupModePicker } from "@/features/decks/components/group-mode-picker";
import { ViewModePicker } from "@/features/decks/components/view-mode-picker";
import { DECK_BOARD_LABELS } from "@/features/decks/constants/deck-formats";
import { useGroupMode } from "@/features/decks/hooks/use-group-mode";
import { useViewMode } from "@/features/decks/hooks/use-view-mode";
import { countCopies, groupByBoard, groupLines } from "@/features/decks/lib/deck-lines";
import type { DeckBoard, DeckCardLine } from "@/features/decks/types/deck";
import { cn } from "@/lib/utils/cn";
import { acceptsCard, dragCard } from "../lib/drag-and-drop";
import { useDeckEditor } from "../store/deck-editor-context";
import { DeckCardTile } from "./deck-card-tile";
import { DeckListRow } from "./deck-list-row";

interface DeckListProps {
  hasCommander: boolean;
  /** Cartas con algún problema de legalidad, para resaltarlas. */
  flaggedCardIds: Set<string>;
}

/** Lo que se ve de cada carta en una pila y lo que mide entera (144 px de ancho, 488×680). */
const STACK_OFFSET = 34;
const STACK_CARD_HEIGHT = 201;

/**
 * El mazo por zonas. El mazo principal se agrupa como elija cada cual (por tipo, coste,
 * color o etiqueta); dentro de cada grupo, por nombre. Las zonas vacías del banquillo y las
 * "quizás" solo aparecen mientras se arrastra una carta, para poder soltarla ahí.
 */
export function DeckList({ hasCommander, flaggedCardIds }: DeckListProps) {
  const entries = useDeckEditor((state) => state.entries);
  const dragged = dragCard(useDndContext().active);

  const [groupMode, setGroupMode] = useGroupMode();
  const [view, setView] = useViewMode("deckforge:vista-editor");

  const boards = useMemo(() => groupByBoard(entries), [entries]);
  const groups = useMemo(() => groupLines(boards.main, groupMode), [boards.main, groupMode]);
  const deckTags = useMemo(
    () => [...new Set(entries.flatMap((entry) => entry.tags))].sort(),
    [entries],
  );

  const accepts = (board: DeckBoard) =>
    acceptsCard(board, dragged, { hasCommander, commanderCount: boards.commander.length });

  /** `group` distingue las cartas que aparecen en varios grupos a la vez (etiquetas). */
  const key = (entry: DeckCardLine) => `${entry.board}:${entry.card.id}`;
  const dragId = (entry: DeckCardLine, group?: string) => group && `${group}|${key(entry)}`;

  const tileProps = (entry: DeckCardLine, group?: string) => ({
    entry,
    hasCommander,
    flagged: flaggedCardIds.has(entry.card.id),
    deckTags,
    dragId: dragId(entry, group),
  });

  const rows = (lines: DeckCardLine[], group?: string) => (
    <ul className="flex flex-col">
      <AnimatePresence initial={false}>
        {lines.map((entry) => (
          <DeckListRow key={key(entry)} {...tileProps(entry, group)} />
        ))}
      </AnimatePresence>
    </ul>
  );

  const gallery = (lines: DeckCardLine[], group?: string) => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2">
      {lines.map((entry) => (
        <DeckCardTile key={key(entry)} {...tileProps(entry, group)} />
      ))}
    </div>
  );

  const stack = (lines: DeckCardLine[], group?: string) => (
    <div
      className="relative w-36"
      style={{ height: (lines.length - 1) * STACK_OFFSET + STACK_CARD_HEIGHT }}
    >
      {lines.map((entry, index) => (
        <DeckCardTile
          key={key(entry)}
          {...tileProps(entry, group)}
          stacked
          style={{ top: index * STACK_OFFSET, zIndex: index }}
          className="absolute inset-x-0 focus-within:z-50! hover:z-50!"
        />
      ))}
    </div>
  );

  /** Las cartas de un grupo, en la vista elegida. */
  const cards = (lines: DeckCardLine[], group?: string) =>
    view === "text"
      ? rows(lines, group)
      : view === "gallery"
        ? gallery(lines, group)
        : stack(lines, group);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <GroupModePicker value={groupMode} onChange={setGroupMode} />
        <ViewModePicker value={view} onChange={setView} />
      </div>

      {hasCommander && (
        <Zone
          board="commander"
          count={countCopies(boards.commander)}
          accepts={accepts("commander")}
        >
          {boards.commander.length > 0 ? (
            cards(boards.commander)
          ) : (
            <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted">
              <Crown className="size-4 shrink-0 text-accent" aria-hidden />
              Busca una criatura legendaria y pulsa la corona para hacerla comandante.
            </p>
          )}
        </Zone>
      )}

      <Zone board="main" count={countCopies(boards.main)} accepts={accepts("main")}>
        {groups.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted">
            El mazo está vacío. Añade cartas con el buscador: por ejemplo, «4 Lightning Bolt».
          </p>
        ) : (
          <div
            className={cn(
              "gap-x-6 gap-y-4",
              // En texto caben dos columnas de grupos; las pilas se colocan una al lado de otra.
              view === "text" && "grid xl:grid-cols-2",
              view === "gallery" && "flex flex-col",
              view === "stacks" && "flex flex-wrap items-start",
            )}
          >
            {groups.map((group) => (
              <section key={group.key} aria-label={group.label}>
                <h4 className="mb-1 px-2 text-xs font-medium text-muted">
                  {group.label} ({countCopies(group.lines)})
                </h4>
                {cards(group.lines, group.key)}
              </section>
            ))}
          </div>
        )}
      </Zone>

      {(["sideboard", "maybeboard"] as const).map((board) => {
        const lines = boards[board];
        if (lines.length === 0 && !accepts(board)) return null;
        return (
          <Zone key={board} board={board} count={countCopies(lines)} accepts={accepts(board)}>
            {lines.length > 0 ? (
              cards(lines)
            ) : (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted">
                Suelta la carta aquí para moverla.
              </p>
            )}
          </Zone>
        );
      })}
    </div>
  );
}

interface ZoneProps {
  board: DeckBoard;
  count: number;
  /** Admite la carta que se está arrastrando ahora mismo. */
  accepts: boolean;
  children: ReactNode;
}

/** Una zona del mazo, que además es donde se sueltan las cartas que se arrastran. */
function Zone({ board, count, accepts, children }: ZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: board, disabled: !accepts });
  const title = DECK_BOARD_LABELS[board];

  return (
    <section
      ref={setNodeRef}
      aria-label={title}
      className={cn(
        "rounded-lg transition-colors duration-150",
        accepts && "outline-1 outline-border outline-dashed",
        isOver && "bg-accent/5 outline-accent",
      )}
    >
      <h3 className="mb-2 flex items-baseline gap-2 border-b border-border pb-1 text-sm font-semibold">
        {title}
        <span className="text-xs font-normal text-muted tabular-nums">{count}</span>
      </h3>
      {children}
    </section>
  );
}
