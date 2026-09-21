"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ColumnResizer } from "@/components/ui/column-resizer";
import { sortColors } from "@/features/cards/lib/colors";
import type { ManaColor } from "@/features/cards/types/card";
import { computeDeckStats } from "@/features/decks/lib/deck-stats";
import { validateDeck } from "@/features/decks/lib/deck-validation";
import type { EntryChange } from "@/features/decks/services/deck-repository";
import type { DeckCardLine, DeckFormat } from "@/features/decks/types/deck";
import { cn } from "@/lib/utils/cn";
import { saveEntriesAction } from "../actions/save-entries-action";
import { useAutosave } from "../hooks/use-autosave";
import {
  COLUMN_LIMITS,
  MIN_DECK_COLUMN,
  useEditorColumns,
  type ColumnSide,
} from "../hooks/use-editor-columns";
import { DeckEditorProvider, useDeckEditor } from "../store/deck-editor-context";
import { CardSearch } from "./card-search";
import { DeckAnalysis } from "./deck-analysis";
import { DeckDndContext } from "./deck-dnd-context";
import { DeckList } from "./deck-list";
import { EditorHeader } from "./editor-header";

interface DeckEditorProps {
  deckId: string;
  name: string;
  format: DeckFormat;
  initialEntries: DeckCardLine[];
}

/** Formatos con comandante (y por tanto con zona de comandante e identidad de color). */
const COMMANDER_FORMATS: DeckFormat[] = ["commander", "brawl"];

/** Pantalla 2 · Editor de mazos. */
export function DeckEditor(props: DeckEditorProps) {
  return (
    <DeckEditorProvider initialEntries={props.initialEntries}>
      <DeckEditorScreen {...props} />
    </DeckEditorProvider>
  );
}

type MobileTab = "add" | "deck" | "analysis";

const MOBILE_TABS: Array<{ id: MobileTab; label: string }> = [
  { id: "add", label: "Añadir" },
  { id: "deck", label: "Mazo" },
  { id: "analysis", label: "Análisis" },
];

function DeckEditorScreen({ deckId, name, format }: DeckEditorProps) {
  const entries = useDeckEditor((state) => state.entries);
  const undo = useDeckEditor((state) => state.undo);
  const redo = useDeckEditor((state) => state.redo);
  const searchRef = useRef<HTMLInputElement>(null);
  const deckColumnRef = useRef<HTMLElement>(null);
  const [tab, setTab] = useState<MobileTab>("deck");
  const columns = useEditorColumns();

  const save = useCallback(
    (changes: EntryChange[]) => saveEntriesAction(deckId, changes),
    [deckId],
  );
  useAutosave(save);

  const hasCommander = COMMANDER_FORMATS.includes(format);
  const commanders = entries.filter((entry) => entry.board === "commander");
  const identity: ManaColor[] | undefined =
    hasCommander && commanders.length > 0
      ? sortColors(commanders.flatMap((entry) => entry.card.colorIdentity))
      : undefined;

  const stats = useMemo(() => computeDeckStats(entries), [entries]);
  const issues = useMemo(() => validateDeck(entries, format), [entries, format]);
  const flaggedCardIds = useMemo(
    () =>
      new Set(
        issues.filter((issue) => issue.level === "error").flatMap((issue) => issue.cardIds ?? []),
      ),
    [issues],
  );

  /** Lleva el foco al buscador, abriendo su pestaña si estamos en móvil. */
  const focusSearch = useCallback(() => {
    setTab("add");
    searchRef.current?.focus();
  }, []);

  // Atajos: Ctrl+Z / Ctrl+Shift+Z (o Ctrl+Y) y "/" para ir al buscador. Dentro de un campo
  // de texto no se tocan: ahí Ctrl+Z deshace lo escrito, como siempre. (Ctrl+K, que abre la
  // paleta, sí funciona desde cualquier sitio: lo escucha ella misma.)
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if (event.key === "/") {
        event.preventDefault();
        focusSearch();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, focusSearch]);

  const panel = (id: MobileTab) => cn(tab !== id && "hidden", "lg:block");

  /** Asa de una columna lateral; la del mazo cede espacio hasta su mínimo, no más. */
  const resizer = (side: ColumnSide, label: string) => (
    <ColumnResizer
      label={label}
      side={side}
      value={columns.widths[side]}
      min={COLUMN_LIMITS[side].min}
      max={(width) =>
        Math.min(
          COLUMN_LIMITS[side].max,
          width + (deckColumnRef.current?.getBoundingClientRect().width ?? 0) - MIN_DECK_COLUMN,
        )
      }
      onResize={(width) => columns.resize(side, width)}
      onResizeEnd={(width) => columns.commit(side, width)}
      onReset={() => columns.reset(side)}
      className="hidden lg:sticky lg:top-20 lg:flex lg:h-[calc(100dvh-6rem)] lg:self-start"
    />
  );
  // Sin ancho elegido, la variable no se define y cada columna usa el suyo de siempre.
  const columnStyle = {
    "--col-left": columns.widths.left && `${columns.widths.left}px`,
    "--col-right": columns.widths.right && `${columns.widths.right}px`,
  } as CSSProperties;

  return (
    <DeckDndContext>
      <div className="flex flex-col gap-5">
        <EditorHeader
          deckId={deckId}
          name={name}
          format={format}
          identity={identity}
          onFocusSearch={focusSearch}
        />

        <div
          role="tablist"
          aria-label="Secciones del editor"
          className="flex rounded-lg border border-border p-0.5 lg:hidden"
        >
          {MOBILE_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 rounded-md py-1.5 text-sm transition-colors duration-150",
                tab === id ? "bg-surface-raised text-foreground" : "text-muted",
              )}
            >
              {label}
              {id === "deck" && (
                <span className="ml-1 text-xs text-muted tabular-nums">{stats.playable}</span>
              )}
            </button>
          ))}
        </div>

        {/* Cinco columnas en escritorio: buscador · asa · mazo · asa · análisis. Con las asas
            de 12 px y 6 px de hueco a cada lado, quedan los mismos 24 px entre columnas. */}
        <div
          style={columnStyle}
          className="grid gap-6 lg:grid-cols-[var(--col-left,300px)_12px_minmax(0,1fr)_12px_var(--col-right,280px)] lg:gap-x-1.5 xl:grid-cols-[var(--col-left,340px)_12px_minmax(0,1fr)_12px_var(--col-right,300px)]"
        >
          <aside
            aria-label="Añadir cartas"
            className={cn(
              panel("add"),
              "lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto",
            )}
          >
            <CardSearch
              inputRef={searchRef}
              hasCommander={hasCommander}
              commanderIdentity={identity}
              commanderSlotFree={commanders.length < 2}
            />
          </aside>

          {resizer("left", "Ancho de la columna para añadir cartas")}

          <section ref={deckColumnRef} aria-label="Lista del mazo" className={panel("deck")}>
            <DeckList hasCommander={hasCommander} flaggedCardIds={flaggedCardIds} />
          </section>

          {resizer("right", "Ancho de la columna de análisis")}

          <aside
            aria-label="Análisis"
            className={cn(
              panel("analysis"),
              "lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto",
            )}
          >
            <DeckAnalysis stats={stats} issues={issues} />
          </aside>
        </div>
      </div>
    </DeckDndContext>
  );
}
