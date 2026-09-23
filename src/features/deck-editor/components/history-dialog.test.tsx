import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useModalDialog } from "@/components/ui/use-modal-dialog";
import { catalogCard } from "@/test/fixtures/catalog-card";
import type { DeckVersion } from "../api/deck-versions";
import { useDeckVersions } from "../hooks/use-deck-versions";
import { HistoryDialog } from "./history-dialog";

vi.mock("../hooks/use-deck-versions", () => ({ useDeckVersions: vi.fn() }));
const history = vi.mocked(useDeckVersions);

const card = (name: string) => catalogCard({ id: name, name });

const loaded = (data: DeckVersion[]) =>
  history.mockReturnValue({ data, isPending: false, isError: false } as never);

/** El diálogo ya abierto, como lo abre la cabecera del editor. */
function Open() {
  const dialog = useModalDialog();
  const { open } = dialog;
  useEffect(() => {
    open();
  }, [open]);
  return <HistoryDialog deckId="mazo-1" dialog={dialog} />;
}

function setup() {
  return render(<Open />);
}

/** El mismo diálogo sin abrir, tal como está mientras no se pide el historial. */
function Closed() {
  return <HistoryDialog deckId="mazo-1" dialog={useModalDialog()} />;
}

const version = (changes: DeckVersion["changes"], minutesAgo = 5): DeckVersion => ({
  id: `v-${minutesAgo}`,
  createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  changes,
});

describe("HistoryDialog", () => {
  beforeEach(() => {
    history.mockReset();
  });

  it("cuenta qué entró y qué salió en cada tanda de cambios", () => {
    loaded([
      version([
        { cardId: "Sol Ring", board: "main", from: 0, to: 1, card: card("Sol Ring") },
        { cardId: "Mountain", board: "main", from: 10, to: 8, card: card("Mountain") },
      ]),
    ]);
    setup();

    expect(screen.getByText("Sol Ring")).toBeInTheDocument();
    expect(screen.getByText("Hace 5 minutos")).toBeInTheDocument();
    // Una copia añadida y dos quitadas.
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText("−2")).toBeInTheDocument();
    // De una carta que ya estaba se ve de cuántas copias pasa a cuántas.
    expect(screen.getByText("10 → 8")).toBeInTheDocument();
  });

  it("dice la zona solo cuando no es el mazo principal", () => {
    loaded([
      version([
        { cardId: "Krenko", board: "commander", from: 0, to: 1, card: card("Krenko") },
        { cardId: "Bolt", board: "main", from: 0, to: 1, card: card("Bolt") },
      ]),
    ]);
    setup();

    expect(screen.getByText("Comandante")).toBeInTheDocument();
    expect(screen.queryByText("Mazo")).not.toBeInTheDocument();
  });

  it("una carta que el catálogo ya no conoce sigue apareciendo", () => {
    loaded([version([{ cardId: "perdida", board: "main", from: 1, to: 0 }])]);
    setup();

    expect(screen.getByText(/ya no está en el catálogo/)).toBeInTheDocument();
  });

  it("sin cambios todavía, lo explica", () => {
    loaded([]);
    setup();

    expect(screen.getByText(/Todavía no hay cambios guardados/)).toBeInTheDocument();
  });

  it("si el historial no se puede cargar, lo dice", () => {
    history.mockReturnValue({ data: undefined, isPending: false, isError: true } as never);
    setup();

    expect(screen.getByText(/No se ha podido cargar el historial/)).toBeInTheDocument();
  });

  it("solo pide el historial mientras está abierto", () => {
    loaded([]);
    render(<Closed />);

    expect(history).toHaveBeenCalledWith("mazo-1", false);
  });
});
