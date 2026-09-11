import type { Metadata } from "next";
import { DeckEditorLayout } from "@/features/deck-editor/components/deck-editor-layout";

export const metadata: Metadata = { title: "Editor de mazo" };

interface DeckEditorPageProps {
  params: Promise<{ deckId: string }>;
}

/** Pantalla 2 · Creación y edición de mazos. */
export default async function DeckEditorPage({ params }: DeckEditorPageProps) {
  const { deckId } = await params;
  return <DeckEditorLayout deckId={deckId} />;
}
