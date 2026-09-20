import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionResult } from "@/features/decks/actions/action-errors";
import type { EntryChange } from "@/features/decks/services/deck-repository";
import { catalogCard } from "@/test/fixtures/catalog-card";
import { DeckEditorProvider, useDeckEditorStoreApi } from "../store/deck-editor-context";
import { RETRY_DELAY_MS, SAVE_DELAY_MS, useAutosave } from "./use-autosave";

const bolt = catalogCard({ id: "bolt", name: "Lightning Bolt" });

function wrapper({ children }: { children: ReactNode }) {
  return <DeckEditorProvider initialEntries={[]}>{children}</DeckEditorProvider>;
}

/** Monta el guardado automático y devuelve el store para simular ediciones. */
function setup(save: (changes: EntryChange[]) => Promise<ActionResult>) {
  const { result } = renderHook(
    () => {
      useAutosave(save);
      return useDeckEditorStoreApi();
    },
    { wrapper },
  );
  return result.current;
}

/** Avanza el reloj y deja que terminen las promesas pendientes (el envío). */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("useAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("espera un momento y agrupa una ráfaga de cambios en un solo envío", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true });
    const store = setup(save);

    act(() => {
      store.getState().addCopies(bolt, "main", 1);
      store.getState().addCopies(bolt, "main", 1);
    });
    await advance(SAVE_DELAY_MS - 1);
    expect(save).not.toHaveBeenCalled();

    await advance(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith([{ cardId: "bolt", board: "main", quantity: 2 }]);
    expect(store.getState().saveStatus).toBe("saved");
  });

  it("si falla, lo explica y lo reintenta solo pasados unos segundos", async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: "Tu sesión ha caducado." })
      .mockResolvedValueOnce({ ok: true });
    const store = setup(save);

    act(() => store.getState().addCopies(bolt, "main", 1));
    await advance(SAVE_DELAY_MS);
    expect(store.getState()).toMatchObject({
      saveStatus: "error",
      saveError: "Tu sesión ha caducado.",
    });

    await advance(RETRY_DELAY_MS);
    expect(save).toHaveBeenCalledTimes(2);
    expect(store.getState().saveStatus).toBe("saved");
  });

  it("sin red (la acción ni llega al servidor) tampoco pierde los cambios", async () => {
    const save = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const store = setup(save);

    act(() => store.getState().addCopies(bolt, "main", 3));
    await advance(SAVE_DELAY_MS);

    expect(store.getState().saveStatus).toBe("error");
    expect(Object.values(store.getState().pending)).toEqual([
      { cardId: "bolt", board: "main", quantity: 3 },
    ]);
  });

  it("nunca hay dos envíos a la vez: lo que cambia mientras guarda sale después", async () => {
    let finishFirst: (result: ActionResult) => void = () => {};
    const save = vi
      .fn()
      .mockImplementationOnce(() => new Promise<ActionResult>((resolve) => (finishFirst = resolve)))
      .mockResolvedValue({ ok: true });
    const store = setup(save);

    act(() => store.getState().addCopies(bolt, "main", 1));
    await advance(SAVE_DELAY_MS);
    act(() => store.getState().addCopies(bolt, "main", 1));
    await advance(SAVE_DELAY_MS * 3);
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => finishFirst({ ok: true }));
    await advance(SAVE_DELAY_MS);

    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith([{ cardId: "bolt", board: "main", quantity: 2 }]);
    expect(store.getState().saveStatus).toBe("saved");
  });
});
