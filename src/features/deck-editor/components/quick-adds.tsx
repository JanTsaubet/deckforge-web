"use client";

import { Crown, Plus, Sparkles } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ManaCost } from "@/features/cards/components/mana-cost";
import type { ManaColor } from "@/features/cards/types/card";
import type { CatalogCard } from "@/features/decks/types/deck";
import { STAPLE_ROLE_LABELS, type StapleGroup } from "../api/catalog-staples";
import { useStaples } from "../hooks/use-staples";
import { useDeckEditor } from "../store/deck-editor-context";

interface QuickAddsProps {
  /** Identidad de color del comandante; sin comandante elegido, `undefined`. */
  identity?: ManaColor[];
}

/** Cuántas se enseñan de cada función: las suficientes para elegir sin abrumar. */
const VISIBLE_PER_ROLE = 5;

/**
 * Quick adds: la base que casi todo mazo de esta identidad juega, por funciones. Montarla a
 * mano —rampa, robo, remoción, tierras— es el trabajo más repetitivo de construir un mazo,
 * y es justo lo que este bloque quita de en medio.
 *
 * Solo propone cartas que el mazo no tenga ya, y cada carta aparece en una sola función
 * aunque haga varias cosas (una piedra de maná que además roba es rampa).
 */
export function QuickAdds({ identity }: QuickAddsProps) {
  const entries = useDeckEditor((state) => state.entries);
  const addCopies = useDeckEditor((state) => state.addCopies);
  const setPreviewCard = useDeckEditor((state) => state.setPreviewCard);
  const [announcement, setAnnouncement] = useState("");

  const staples = useStaples(identity);

  /** Lo que ya está en el mazo, por carta (no por impresión): otra edición es la misma carta. */
  const inDeck = useMemo(() => new Set(entries.map((entry) => cardKey(entry.card))), [entries]);

  const groups = useMemo(() => pickSuggestions(staples.data ?? [], inDeck), [staples.data, inDeck]);

  function add(cards: CatalogCard[], what: string) {
    for (const card of cards) addCopies(card, "main", 1);
    setAnnouncement(`Añadido al mazo: ${what}.`);
  }

  if (identity === undefined) {
    return (
      <Panel>
        <p className="flex gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted">
          <Crown className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <span className="text-pretty">
            Elige un comandante y aquí saldrá lo que casi todos los mazos de su identidad juegan:
            rampa, robo, remoción y tierras.
          </span>
        </p>
      </Panel>
    );
  }

  if (staples.isPending) {
    return (
      <Panel>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      </Panel>
    );
  }

  if (staples.isError) {
    return (
      <Panel>
        <p className="text-sm text-muted">
          No se han podido cargar las recomendaciones. Sigue buscando cartas arriba.
        </p>
      </Panel>
    );
  }

  if (groups.length === 0) {
    return (
      <Panel>
        <p className="text-sm text-success">
          Ya tienes lo más jugado de esta identidad en el mazo.
        </p>
      </Panel>
    );
  }

  return (
    <Panel>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div className="flex flex-col gap-4">
        {groups.map(({ role, cards }) => (
          <section key={role} aria-label={STAPLE_ROLE_LABELS[role]}>
            <h4 className="mb-1 flex items-baseline justify-between gap-2 px-1 text-xs font-medium text-muted">
              {STAPLE_ROLE_LABELS[role]}
              <button
                type="button"
                onClick={() => add(cards, `${cards.length} de ${STAPLE_ROLE_LABELS[role]}`)}
                className="font-normal text-accent underline-offset-2 transition-colors duration-150 hover:underline"
              >
                Añadir las {cards.length}
              </button>
            </h4>

            <ul className="flex flex-col gap-0.5">
              {cards.map((card) => (
                <li
                  key={card.id}
                  onMouseEnter={() => setPreviewCard(card)}
                  className="flex items-center gap-2 rounded-md p-1 text-sm transition-colors duration-100 hover:bg-surface-raised/60"
                >
                  {card.imageSmall ? (
                    // `unoptimized`: las imágenes de Scryfall ya vienen optimizadas desde su CDN.
                    <Image
                      src={card.imageSmall}
                      alt=""
                      width={24}
                      height={33}
                      unoptimized
                      className="h-[33px] w-6 rounded-sm object-cover"
                    />
                  ) : (
                    <span className="h-[33px] w-6 rounded-sm bg-surface-raised" aria-hidden />
                  )}
                  <button
                    type="button"
                    onClick={() => add([card], card.name)}
                    onFocus={() => setPreviewCard(card)}
                    className="min-w-0 flex-1 truncate text-left"
                  >
                    {card.name}
                  </button>
                  {card.manaCost && (
                    <ManaCost cost={card.manaCost} className="shrink-0 [&_img]:size-3.5" />
                  )}
                  <button
                    type="button"
                    onClick={() => add([card], card.name)}
                    aria-label={`Añadir ${card.name} al mazo`}
                    title="Añadir al mazo"
                    className="grid size-6 shrink-0 place-items-center rounded text-muted transition-colors duration-150 hover:bg-surface hover:text-foreground"
                  >
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section aria-label="Recomendado para este comandante" className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-accent" aria-hidden />
        Recomendado para este comandante
      </h3>
      {children}
    </section>
  );
}

/** Una carta es la misma aunque sea otra edición: se comparan por `oracleId`, o por nombre. */
function cardKey(card: CatalogCard): string {
  return card.oracleId ?? card.name.toLowerCase();
}

/**
 * De lo que propone la API, lo que este mazo no tiene: hasta cinco por función y sin repetir
 * una carta en dos funciones (sale en la primera en la que encaja). Las funciones que se
 * quedan sin nada que proponer no se enseñan.
 */
function pickSuggestions(groups: StapleGroup[], inDeck: Set<string>): StapleGroup[] {
  const used = new Set(inDeck);

  return groups.flatMap((group) => {
    const cards = group.cards.filter((card) => !used.has(cardKey(card))).slice(0, VISIBLE_PER_ROLE);
    for (const card of cards) used.add(cardKey(card));
    return cards.length > 0 ? [{ role: group.role, cards }] : [];
  });
}
