import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckCardLine } from "@/features/decks/types/deck";
import { catalogCard } from "@/test/fixtures/catalog-card";
import type { StapleGroup } from "../api/catalog-staples";
import { useStaples } from "../hooks/use-staples";
import { DeckEditorProvider, useDeckEditorStoreApi } from "../store/deck-editor-context";
import type { DeckEditorStoreApi } from "../store/deck-editor-store";
import { QuickAdds } from "./quick-adds";

vi.mock("../hooks/use-staples", () => ({ useStaples: vi.fn() }));
const staples = vi.mocked(useStaples);

const card = (name: string, overrides: Parameters<typeof catalogCard>[0] = {}) =>
  catalogCard({ id: name, oracleId: `oracle-${name}`, name, ...overrides });

const sol = card("Sol Ring");
const signet = card("Arcane Signet");
const clamp = card("Skullclamp");
const tower = card("Command Tower");

const groups = (data: StapleGroup[]) =>
  staples.mockReturnValue({ data, isPending: false, isError: false } as never);

let store: DeckEditorStoreApi;

function Probe({ onReady }: { onReady: (api: DeckEditorStoreApi) => void }) {
  const api = useDeckEditorStoreApi();
  useEffect(() => {
    onReady(api);
  }, [api, onReady]);
  return null;
}

function setup(entries: DeckCardLine[] = []) {
  render(
    <DeckEditorProvider initialEntries={entries}>
      <Probe onReady={(api) => (store = api)} />
      <QuickAdds identity={["R"]} />
    </DeckEditorProvider>,
  );
  return userEvent.setup();
}

const inDeck = () =>
  store.getState().entries.map((entry) => `${entry.card.name}×${entry.quantity}`);

describe("QuickAdds", () => {
  beforeEach(() => {
    staples.mockReset();
    groups([
      { role: "ramp", cards: [sol, signet] },
      { role: "draw", cards: [clamp] },
      { role: "land", cards: [tower] },
    ]);
  });

  it("propone las cartas por función y añade la que se pulsa", async () => {
    const user = setup();

    expect(screen.getByRole("region", { name: "Rampa" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Tierras" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Añadir Sol Ring al mazo" }));

    expect(inDeck()).toEqual(["Sol Ring×1"]);
  });

  it("añade de golpe todas las de una función", async () => {
    const user = setup();

    const ramp = screen.getByRole("region", { name: "Rampa" });
    await user.click(within(ramp).getByRole("button", { name: "Añadir las 2" }));

    expect(inDeck()).toEqual(["Sol Ring×1", "Arcane Signet×1"]);
  });

  it("no propone lo que el mazo ya tiene, aunque sea otra edición", async () => {
    // Misma carta, otra impresión: se reconoce por su `oracleId`.
    const otherPrinting = { ...sol, id: "sol-2" };
    setup([{ card: otherPrinting, board: "main", quantity: 1, tags: [] }]);

    expect(screen.queryByText("Sol Ring")).not.toBeInTheDocument();
    expect(screen.getByText("Arcane Signet")).toBeInTheDocument();
  });

  it("una carta que hace dos cosas sale solo en la primera función", () => {
    groups([
      { role: "ramp", cards: [sol] },
      { role: "draw", cards: [sol, clamp] },
    ]);
    setup();

    expect(screen.getAllByText("Sol Ring")).toHaveLength(1);
    expect(within(screen.getByRole("region", { name: "Robo" })).getByText("Skullclamp"));
  });

  it("sin comandante, explica qué saldrá aquí", () => {
    render(
      <DeckEditorProvider initialEntries={[]}>
        <QuickAdds />
      </DeckEditorProvider>,
    );

    expect(screen.getByText(/Elige un comandante/)).toBeInTheDocument();
  });

  it("cuando el mazo ya lo tiene todo, lo dice", () => {
    groups([{ role: "ramp", cards: [sol] }]);
    setup([{ card: sol, board: "main", quantity: 1, tags: [] }]);

    expect(screen.getByText(/Ya tienes lo más jugado/)).toBeInTheDocument();
  });
});
