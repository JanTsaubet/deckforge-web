"use client";

import Link from "next/link";
import { routes } from "@/config/routes";
import { ManaCost } from "@/features/cards/components/mana-cost";
import type { CatalogCard, DeckCardLine } from "../types/deck";

interface DeckViewListProps {
  lines: DeckCardLine[];
  /** Se avisa al señalar una carta para enseñarla en grande al lado. */
  onPreview: (card: CatalogCard) => void;
}

const EURO = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

/**
 * Las cartas de una zona, en texto: cantidad, nombre, precio de esas copias y coste.
 * Cada nombre lleva a la ficha de la carta; señalarlo la enseña en el panel de al lado.
 */
export function DeckViewList({ lines, onPreview }: DeckViewListProps) {
  return (
    <ul className="flex flex-col">
      {lines.map(({ card, quantity }) => (
        <li
          key={card.id}
          onMouseEnter={() => onPreview(card)}
          onFocus={() => onPreview(card)}
          className="group flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors duration-150 hover:bg-surface-raised/60"
        >
          <span className="w-6 shrink-0 text-right text-muted tabular-nums">{quantity}</span>
          <Link
            href={routes.card(card.id)}
            title={card.typeLine}
            className="min-w-0 flex-1 truncate outline-none group-hover:text-accent focus-visible:text-accent"
          >
            {card.name}
          </Link>
          {card.priceEur !== undefined && (
            <span className="hidden shrink-0 text-xs text-muted tabular-nums sm:inline">
              {EURO.format(card.priceEur * quantity)}
            </span>
          )}
          {card.manaCost && <ManaCost cost={card.manaCost} className="shrink-0 [&_img]:size-4" />}
        </li>
      ))}
    </ul>
  );
}
