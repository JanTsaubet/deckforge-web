import type { Metadata } from "next";
import { routes } from "@/config/routes";
import { loadDeckPage } from "@/features/decks/api/load-deck";
import { DeckView } from "@/features/decks/components/deck-view";
import { DeckViewHeader } from "@/features/decks/components/deck-view-header";
import { DECK_FORMAT_LABELS } from "@/features/decks/constants/deck-formats";
import { countCopies, playableLines, toDeckCardLines } from "@/features/decks/lib/deck-lines";
import type { Deck } from "@/features/decks/types/deck";

interface DeckPageProps {
  params: Promise<{ deckId: string }>;
}

/** Descripción para buscadores y para cuando se comparte el enlace. */
function describeDeck(deck: Deck, cardCount: number): string {
  const own = deck.description?.trim();
  if (own) return own;
  return `Mazo de ${DECK_FORMAT_LABELS[deck.format]} de @${deck.ownerUsername}, con ${cardCount} cartas.`;
}

export async function generateMetadata({ params }: DeckPageProps): Promise<Metadata> {
  const { deckId } = await params;
  const deck = await loadDeckPage(deckId, routes.deck(deckId));
  const description = describeDeck(deck, countCopies(playableLines(toDeckCardLines(deck.entries))));

  return {
    title: deck.name,
    description,
    // Los mazos ocultos se comparten con quien tenga el enlace, pero no se indexan.
    robots: deck.visibility === "public" ? undefined : { index: false, follow: false },
    openGraph: {
      type: "article",
      title: deck.name,
      description,
      images: deck.coverImageUrl ? [deck.coverImageUrl] : undefined,
    },
  };
}

/**
 * Pantalla 6 · Vista pública de un mazo.
 *
 * Es la única pantalla de mazos abierta a quien no ha entrado (los mazos privados responden
 * 404 hasta para saber que existen), así que se renderiza en el servidor con sus metadatos.
 */
export default async function DeckPage({ params }: DeckPageProps) {
  const { deckId } = await params;
  const deck = await loadDeckPage(deckId, routes.deck(deckId));

  const lines = toDeckCardLines(deck.entries);
  // Cartas guardadas cuyo dato no está en el catálogo: se avisa en vez de omitirlas sin más.
  const unknownCards = deck.entries
    .filter((entry) => !entry.card)
    .reduce((total, entry) => total + entry.quantity, 0);

  return (
    <div className="flex flex-col gap-6">
      <DeckViewHeader deck={deck} cardCount={countCopies(playableLines(lines))} />
      <DeckView lines={lines} format={deck.format} unknownCards={unknownCards} />
    </div>
  );
}
