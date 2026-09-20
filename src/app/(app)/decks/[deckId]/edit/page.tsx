import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { DeckEditor } from "@/features/deck-editor/components/deck-editor";
import { loadDeckPage } from "@/features/decks/api/load-deck";
import { toDeckCardLines } from "@/features/decks/lib/deck-lines";

interface DeckEditorPageProps {
  params: Promise<{ deckId: string }>;
}

export async function generateMetadata({ params }: DeckEditorPageProps): Promise<Metadata> {
  const { deckId } = await params;
  const deck = await loadDeckPage(deckId, routes.deckEditor(deckId));
  return { title: `Editando ${deck.name}` };
}

/** Pantalla 2 · Editor de mazos. Solo para su dueño: a los demás se les lleva a verlo. */
export default async function DeckEditorPage({ params }: DeckEditorPageProps) {
  const { deckId } = await params;
  const deck = await loadDeckPage(deckId, routes.deckEditor(deckId));
  if (!deck.viewerCanEdit) redirect(routes.deck(deckId));

  return (
    <DeckEditor
      deckId={deck.id}
      name={deck.name}
      format={deck.format}
      initialEntries={toDeckCardLines(deck.entries)}
    />
  );
}
