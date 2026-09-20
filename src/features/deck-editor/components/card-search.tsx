"use client";

import { Crown, Loader2, Plus, Search } from "lucide-react";
import Image from "next/image";
import { useId, useState, type KeyboardEvent, type Ref } from "react";
import { ColorIdentity } from "@/features/cards/components/color-identity";
import { ManaCost } from "@/features/cards/components/mana-cost";
import type { ManaColor } from "@/features/cards/types/card";
import { DECK_BOARD_LABELS } from "@/features/decks/constants/deck-formats";
import { canBeCommander } from "@/features/decks/lib/deck-validation";
import type { CatalogCard, DeckBoard } from "@/features/decks/types/deck";
import { cn } from "@/lib/utils/cn";
import { MIN_QUERY_LENGTH, useCatalogSearch } from "../hooks/use-catalog-search";
import { parseQuickAdd } from "../lib/quick-add";
import { useDeckEditor } from "../store/deck-editor-context";

interface CardSearchProps {
  hasCommander: boolean;
  /** Identidad del comandante elegido; `undefined` si no hay (o el formato no tiene). */
  commanderIdentity?: ManaColor[];
  /** Hay hueco para otro comandante (0 o 1 elegidos). */
  commanderSlotFree: boolean;
  /** Para enfocar el buscador con el atajo "/". */
  inputRef?: Ref<HTMLInputElement>;
}

const TARGET_BOARDS: DeckBoard[] = ["main", "sideboard", "maybeboard"];

/**
 * Buscador para añadir cartas. Se usa casi sin ratón: escribir ("4 Lightning Bolt" añade
 * cuatro), flechas para elegir y Enter para añadir. Con comandante, por defecto solo ofrece
 * cartas de su identidad de color.
 */
export function CardSearch({
  hasCommander,
  commanderIdentity,
  commanderSlotFree,
  inputRef,
}: CardSearchProps) {
  const listId = useId();
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);
  const [target, setTarget] = useState<DeckBoard>("main");
  const [onlyIdentity, setOnlyIdentity] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const addCopies = useDeckEditor((state) => state.addCopies);
  const setPreviewCard = useDeckEditor((state) => state.setPreviewCard);

  const { quantity, query } = parseQuickAdd(text);
  const identity = commanderIdentity && onlyIdentity ? commanderIdentity : undefined;
  const search = useCatalogSearch(query, identity);
  const results = query.length >= MIN_QUERY_LENGTH ? (search.data ?? []) : [];

  function add(card: CatalogCard, board: DeckBoard, copies: number) {
    addCopies(card, board, copies);
    setAnnouncement(`Añadido: ${copies} × ${card.name} (${DECK_BOARD_LABELS[board]}).`);
    setText("");
    setActive(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const card = results[Math.min(active, results.length - 1)];
      if (card) add(card, target, quantity);
    } else if (event.key === "Escape") {
      setText("");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="relative block">
        <span className="sr-only">Buscar cartas para añadir</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          ref={inputRef}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setActive(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="4 Lightning Bolt"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-activedescendant={results.length > 0 ? `${listId}-${active}` : undefined}
          className="h-10 w-full rounded-lg border border-border bg-surface pr-9 pl-9 text-sm transition-colors duration-200 outline-none placeholder:text-muted/60 focus:border-accent"
        />
        {search.isFetching && (
          <Loader2
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted"
            aria-hidden
          />
        )}
      </label>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted">Añadir a</span>
        <div
          role="radiogroup"
          aria-label="Zona de destino"
          className="flex rounded-md border border-border p-0.5"
        >
          {TARGET_BOARDS.map((board) => (
            <button
              key={board}
              type="button"
              role="radio"
              aria-checked={target === board}
              onClick={() => setTarget(board)}
              className={cn(
                "rounded px-2 py-0.5 transition-colors duration-150",
                target === board
                  ? "bg-surface-raised text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {DECK_BOARD_LABELS[board]}
            </button>
          ))}
        </div>
        {commanderIdentity && (
          <label className="flex cursor-pointer items-center gap-1.5 text-muted">
            <input
              type="checkbox"
              checked={onlyIdentity}
              onChange={(event) => setOnlyIdentity(event.target.checked)}
              className="accent-accent"
            />
            Solo identidad
            {commanderIdentity.length > 0 ? (
              <ColorIdentity colors={commanderIdentity} />
            ) : (
              " incolora"
            )}
          </label>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <ul id={listId} role="listbox" aria-label="Resultados" className="flex flex-col gap-0.5">
        {results.map((card, index) => (
          <li
            key={card.id}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            onMouseEnter={() => {
              setActive(index);
              setPreviewCard(card);
            }}
            className={cn(
              "flex items-center gap-2 rounded-md p-1.5 text-sm transition-colors duration-100",
              index === active ? "bg-surface-raised" : "hover:bg-surface-raised/60",
            )}
          >
            {card.imageSmall ? (
              // `unoptimized`: las imágenes de Scryfall ya vienen optimizadas desde su CDN.
              <Image
                src={card.imageSmall}
                alt=""
                width={28}
                height={39}
                unoptimized
                className="h-[39px] w-7 rounded-sm object-cover"
              />
            ) : (
              <span className="h-[39px] w-7 rounded-sm bg-surface-raised" aria-hidden />
            )}
            <button
              type="button"
              onClick={() => add(card, target, quantity)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate">{card.name}</span>
              <span className="block truncate text-xs text-muted">{card.typeLine}</span>
            </button>
            {card.manaCost && <ManaCost cost={card.manaCost} className="shrink-0 [&_img]:size-4" />}
            {hasCommander && commanderSlotFree && canBeCommander(card) && (
              <button
                type="button"
                onClick={() => add(card, "commander", 1)}
                aria-label={`Añadir ${card.name} como comandante`}
                title="Como comandante"
                className="grid size-7 shrink-0 place-items-center rounded text-muted transition-colors hover:bg-surface hover:text-accent"
              >
                <Crown className="size-4" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => add(card, target, quantity)}
              aria-label={`Añadir ${quantity} × ${card.name}`}
              title={`Añadir ${quantity}`}
              className="grid size-7 shrink-0 place-items-center rounded text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      {query.length >= MIN_QUERY_LENGTH && !search.isFetching && results.length === 0 && (
        <p className="px-1 text-sm text-muted">
          {search.isError
            ? "La búsqueda ha fallado. Inténtalo de nuevo."
            : `Nada con «${query}»${identity ? " en esta identidad de color" : ""}.`}
        </p>
      )}
      {query.length < MIN_QUERY_LENGTH && (
        <p className="px-1 text-xs text-muted">
          Escribe el nombre (con una cantidad delante si quieres varias) y pulsa Enter. Usa las
          flechas para elegir.
        </p>
      )}
    </div>
  );
}
