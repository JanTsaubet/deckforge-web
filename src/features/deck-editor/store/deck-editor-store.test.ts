import { beforeEach, describe, expect, it } from "vitest";
import { useDeckEditorStore } from "./deck-editor-store";

const initialState = useDeckEditorStore.getState();

describe("deck-editor-store", () => {
  beforeEach(() => {
    useDeckEditorStore.setState({ deckId: null, entries: [], isDirty: false }, false);
  });

  it("añade una carta nueva con cantidad 1 y marca cambios pendientes", () => {
    initialState.addCard("carta-1");

    expect(useDeckEditorStore.getState().entries).toEqual([
      { cardId: "carta-1", board: "main", quantity: 1, tags: [] },
    ]);
    expect(useDeckEditorStore.getState().isDirty).toBe(true);
  });

  it("suma cantidad en lugar de duplicar la entrada", () => {
    initialState.addCard("carta-1");
    initialState.addCard("carta-1");

    const { entries } = useDeckEditorStore.getState();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.quantity).toBe(2);
  });

  it("distingue la misma carta en zonas distintas", () => {
    initialState.addCard("carta-1", "main");
    initialState.addCard("carta-1", "sideboard");

    expect(useDeckEditorStore.getState().entries).toHaveLength(2);
  });

  it("elimina la entrada cuando la cantidad llega a cero", () => {
    initialState.addCard("carta-1");
    initialState.removeCard("carta-1");

    expect(useDeckEditorStore.getState().entries).toEqual([]);
  });

  it("loadDeck deja el editor sin cambios pendientes", () => {
    initialState.addCard("carta-1");
    initialState.loadDeck("mazo-1", []);

    const state = useDeckEditorStore.getState();
    expect(state.deckId).toBe("mazo-1");
    expect(state.isDirty).toBe(false);
  });
});
