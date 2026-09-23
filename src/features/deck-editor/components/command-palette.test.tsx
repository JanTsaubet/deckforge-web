import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { catalogCard } from "@/test/fixtures/catalog-card";
import { useCatalogSearch } from "../hooks/use-catalog-search";
import type { DeckEditorStoreApi } from "../store/deck-editor-store";
import { DeckEditorProvider, useDeckEditorStoreApi } from "../store/deck-editor-context";
import { CommandPalette } from "./command-palette";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("../hooks/use-catalog-search", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../hooks/use-catalog-search")>()),
  useCatalogSearch: vi.fn(),
}));

const search = vi.mocked(useCatalogSearch);
const sol = catalogCard({ id: "sol", name: "Sol Ring", typeLine: "Artifact" });

/** Al componente solo le importan estos tres campos del resultado de la búsqueda. */
function results(cards = [sol], isFetching = false) {
  search.mockReturnValue({ data: cards, isFetching, isError: false } as never);
}

let store: DeckEditorStoreApi;

/** Saca el store del contexto para poder mirar (y tocar) el mazo desde el test. */
function Probe({ onReady }: { onReady: (api: DeckEditorStoreApi) => void }) {
  const api = useDeckEditorStoreApi();
  useEffect(() => {
    onReady(api);
  }, [api, onReady]);
  return null;
}

function setup(onFocusSearch = vi.fn()) {
  const onShowHistory = vi.fn();
  const user = userEvent.setup();
  const view = render(
    <DeckEditorProvider initialEntries={[]}>
      <Probe onReady={(api) => (store = api)} />
      <CommandPalette deckId="mazo-1" onFocusSearch={onFocusSearch} onShowHistory={onShowHistory} />
    </DeckEditorProvider>,
  );
  const dialog = () => view.container.querySelector("dialog");
  return { user, dialog, onFocusSearch, onShowHistory };
}

const openPalette = (user: ReturnType<typeof userEvent.setup>) =>
  user.keyboard("{Control>}k{/Control}");

const entries = () =>
  store.getState().entries.map((entry) => `${entry.board}:${entry.card.id}×${entry.quantity}`);

describe("CommandPalette", () => {
  beforeEach(() => {
    push.mockReset();
    results([]);
  });

  it("se abre y se cierra con Ctrl+K", async () => {
    const { user, dialog } = setup();
    expect(dialog()?.open).toBe(false);

    await openPalette(user);
    expect(dialog()?.open).toBe(true);

    await openPalette(user);
    expect(dialog()?.open).toBe(false);
  });

  it("busca cartas y las añade al mazo, con la cantidad que se escriba", async () => {
    results();
    const { user, dialog } = setup();
    await openPalette(user);

    await user.type(screen.getByRole("combobox"), "4 sol ring");
    await user.click(screen.getByText("Sol Ring"));

    expect(entries()).toEqual(["main:sol×4"]);
    // Tras usarla, se quita de en medio.
    expect(dialog()?.open).toBe(false);
  });

  it("filtra las acciones por lo escrito, sin tildes", async () => {
    const { user } = setup();
    await openPalette(user);

    await user.type(screen.getByRole("combobox"), "anadir");

    expect(screen.getByText("Buscar cartas para añadir")).toBeInTheDocument();
    expect(screen.queryByText("Ir a mis mazos")).not.toBeInTheDocument();
  });

  it("solo ofrece deshacer cuando hay algo que deshacer", async () => {
    const { user } = setup();
    await openPalette(user);
    expect(screen.queryByText("Deshacer")).not.toBeInTheDocument();

    await openPalette(user);
    store.getState().addCopies(sol, "main", 1);
    await openPalette(user);

    await user.click(screen.getByText("Deshacer"));
    expect(entries()).toEqual([]);
  });

  it("lleva el foco al buscador de la columna izquierda", async () => {
    const { user, onFocusSearch } = setup();
    await openPalette(user);

    await user.click(screen.getByText("Buscar cartas para añadir"));

    expect(onFocusSearch).toHaveBeenCalled();
  });

  it("abre el historial de cambios", async () => {
    const { user, onShowHistory } = setup();
    await openPalette(user);

    await user.click(screen.getByText("Ver el historial de cambios"));

    expect(onShowHistory).toHaveBeenCalled();
  });

  it("navega a la vista pública del mazo", async () => {
    const { user } = setup();
    await openPalette(user);

    await user.click(screen.getByText("Ver el mazo como lo ven los demás"));

    expect(push).toHaveBeenCalledWith("/decks/mazo-1");
  });
});
