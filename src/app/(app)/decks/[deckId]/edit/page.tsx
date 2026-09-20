import type { Metadata, Route } from "next";
import { notFound, redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { DeckEditor } from "@/features/deck-editor/components/deck-editor";
import { toEditorEntries } from "@/features/deck-editor/lib/editor-entries";
import { createServerDeckRepository } from "@/features/decks/api/server-deck-repository";
import type { Deck } from "@/features/decks/types/deck";
import { HttpError } from "@/lib/http/http-client";

interface DeckEditorPageProps {
  params: Promise<{ deckId: string }>;
}

async function loadDeck(deckId: string): Promise<Deck> {
  try {
    const repository = await createServerDeckRepository();
    return await repository.getById(deckId);
  } catch (error) {
    if (error instanceof HttpError) {
      // 400: el id ni siquiera tiene forma de id. Para quien navega, es lo mismo que no existir.
      if (error.status === 404 || error.status === 400) notFound();
      if (error.status === 401) {
        redirect(`${routes.login}?next=${encodeURIComponent(routes.deckEditor(deckId))}` as Route);
      }
    }
    throw error;
  }
}

export async function generateMetadata({ params }: DeckEditorPageProps): Promise<Metadata> {
  const { deckId } = await params;
  const deck = await loadDeck(deckId);
  return { title: `Editando ${deck.name}` };
}

/** Pantalla 2 · Editor de mazos. Solo para su dueño: a los demás se les lleva a verlo. */
export default async function DeckEditorPage({ params }: DeckEditorPageProps) {
  const { deckId } = await params;
  const deck = await loadDeck(deckId);
  if (!deck.viewerCanEdit) redirect(routes.deck(deckId));

  return (
    <DeckEditor
      deckId={deck.id}
      name={deck.name}
      format={deck.format}
      initialEntries={toEditorEntries(deck.entries)}
    />
  );
}
