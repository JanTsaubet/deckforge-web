import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_HISTORY_ENTRIES, searchHistoryStore } from "./search-history-store";

beforeEach(() => {
  window.localStorage.clear();
});

describe("searchHistoryStore", () => {
  it("guarda las búsquedas con la más reciente primero", () => {
    searchHistoryStore.add("t:creature");
    searchHistoryStore.add("c:g");

    expect(searchHistoryStore.getSnapshot()).toEqual(["c:g", "t:creature"]);
  });

  it("repetir una búsqueda la sube en lugar de duplicarla", () => {
    searchHistoryStore.add("t:creature");
    searchHistoryStore.add("c:g");
    searchHistoryStore.add("t:creature");

    expect(searchHistoryStore.getSnapshot()).toEqual(["t:creature", "c:g"]);
  });

  it(`conserva como mucho ${MAX_HISTORY_ENTRIES} búsquedas`, () => {
    for (let index = 0; index < MAX_HISTORY_ENTRIES + 3; index++) {
      searchHistoryStore.add(`consulta ${index}`);
    }

    const entries = searchHistoryStore.getSnapshot();
    expect(entries).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(entries[0]).toBe(`consulta ${MAX_HISTORY_ENTRIES + 2}`);
  });

  it("ignora las búsquedas vacías", () => {
    searchHistoryStore.add("   ");

    expect(searchHistoryStore.getSnapshot()).toEqual([]);
  });

  it("quita una entrada o vacía el historial entero", () => {
    searchHistoryStore.add("a");
    searchHistoryStore.add("b");

    searchHistoryStore.remove("a");
    expect(searchHistoryStore.getSnapshot()).toEqual(["b"]);

    searchHistoryStore.clear();
    expect(searchHistoryStore.getSnapshot()).toEqual([]);
  });

  it("un valor corrupto en el almacenamiento se trata como historial vacío", () => {
    window.localStorage.setItem("deckforge:search-history", "{esto no es json");

    expect(searchHistoryStore.getSnapshot()).toEqual([]);
  });

  it("devuelve la misma referencia mientras no cambie el contenido", () => {
    searchHistoryStore.add("t:creature");

    // useSyncExternalStore compara por referencia: un array nuevo en cada lectura
    // provocaría renders infinitos.
    expect(searchHistoryStore.getSnapshot()).toBe(searchHistoryStore.getSnapshot());
  });

  it("avisa a los suscriptores cuando cambia", () => {
    const listener = vi.fn();
    const unsubscribe = searchHistoryStore.subscribe(listener);

    searchHistoryStore.add("t:creature");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    searchHistoryStore.add("c:g");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
