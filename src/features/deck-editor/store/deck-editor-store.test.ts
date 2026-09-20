import { describe, expect, it } from "vitest";
import { catalogCard } from "@/test/fixtures/catalog-card";
import { createDeckEditorStore } from "./deck-editor-store";

const bolt = catalogCard({ id: "bolt", name: "Lightning Bolt" });
const krenko = catalogCard({ id: "krenko", name: "Krenko, Mob Boss" });

const quantities = (store: ReturnType<typeof createDeckEditorStore>) =>
  store.getState().entries.map((entry) => `${entry.board}:${entry.card.id}×${entry.quantity}`);

describe("deck-editor-store", () => {
  it("los cambios se ven al instante y quedan pendientes de guardar", () => {
    const store = createDeckEditorStore([]);

    store.getState().addCopies(bolt, "main", 4);

    expect(quantities(store)).toEqual(["main:bolt×4"]);
    expect(store.getState().saveStatus).toBe("pending");
    expect(Object.values(store.getState().pending)).toEqual([
      { cardId: "bolt", board: "main", quantity: 4 },
    ]);
  });

  it("varios cambios de la misma carta se envían como uno, con la cantidad final", () => {
    const store = createDeckEditorStore([]);
    store.getState().addCopies(bolt, "main", 1);
    store.getState().addCopies(bolt, "main", 1);
    store.getState().addCopies(bolt, "main", 1);

    expect(store.getState().beginSave()).toEqual([{ cardId: "bolt", board: "main", quantity: 3 }]);
  });

  it("deshacer y rehacer vuelven al estado anterior y también se guardan", () => {
    const store = createDeckEditorStore([{ card: krenko, board: "main", quantity: 1 }]);
    store.getState().moveCard(krenko, "main", "commander");
    store.getState().saveSucceeded(store.getState().beginSave());

    store.getState().undo();
    expect(quantities(store)).toEqual(["main:krenko×1"]);
    expect(store.getState().beginSave()).toEqual([
      { cardId: "krenko", board: "main", quantity: 1 },
      { cardId: "krenko", board: "commander", quantity: 0 },
    ]);

    store.getState().redo();
    expect(quantities(store)).toEqual(["commander:krenko×1"]);
  });

  it("un cambio nuevo después de deshacer borra lo que se podía rehacer", () => {
    const store = createDeckEditorStore([]);
    store.getState().addCopies(bolt, "main", 1);
    store.getState().undo();

    store.getState().addCopies(krenko, "main", 1);

    expect(store.getState().future).toEqual([]);
  });

  it("si una carta cambia mientras se guarda, sigue pendiente con su valor nuevo", () => {
    const store = createDeckEditorStore([]);
    store.getState().addCopies(bolt, "main", 1);
    const sent = store.getState().beginSave();

    store.getState().addCopies(bolt, "main", 1);
    store.getState().saveSucceeded(sent);

    expect(store.getState().saveStatus).toBe("pending");
    expect(Object.values(store.getState().pending)).toEqual([
      { cardId: "bolt", board: "main", quantity: 2 },
    ]);
  });

  it("si el guardado falla, los cambios no se pierden", () => {
    const store = createDeckEditorStore([]);
    store.getState().addCopies(bolt, "main", 2);
    store.getState().beginSave();

    store.getState().saveFailed("Sin conexión");

    expect(store.getState()).toMatchObject({ saveStatus: "error", saveError: "Sin conexión" });
    expect(store.getState().beginSave()).toEqual([{ cardId: "bolt", board: "main", quantity: 2 }]);
  });

  it("una acción que no cambia nada no ensucia el historial", () => {
    const store = createDeckEditorStore([]);

    store.getState().addCopies(bolt, "main", -1);

    expect(store.getState()).toMatchObject({ past: [], saveStatus: "saved" });
  });
});
