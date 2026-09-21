import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { catalogCard } from "@/test/fixtures/catalog-card";
import type { DeckCardLine } from "../types/deck";
import { DeckView } from "./deck-view";

const krenko = catalogCard({
  id: "krenko",
  name: "Krenko, Mob Boss",
  typeLine: "Legendary Creature — Goblin Warrior",
  colorIdentity: ["R"],
  imageNormal: "https://cards.test/krenko.jpg",
});
const bolt = catalogCard({
  id: "bolt",
  name: "Lightning Bolt",
  typeLine: "Instant",
  manaCost: "{R}",
  colorIdentity: ["R"],
  priceEur: 1.5,
});
const mountain = catalogCard({
  id: "mountain",
  name: "Mountain",
  typeLine: "Basic Land — Mountain",
  colorIdentity: ["R"],
});
const island = catalogCard({
  id: "island",
  name: "Island",
  typeLine: "Basic Land — Island",
  colorIdentity: ["U"],
});

const deck = (...lines: DeckCardLine[]) => [
  { card: krenko, board: "commander" as const, quantity: 1, tags: [] },
  ...lines,
];

describe("DeckView", () => {
  it("enseña cada zona con sus cartas y agrupa el mazo por tipo", () => {
    render(
      <DeckView
        lines={deck(
          { card: bolt, board: "main", quantity: 1, tags: [] },
          { card: mountain, board: "main", quantity: 98, tags: [] },
          { card: island, board: "maybeboard", quantity: 1, tags: [] },
        )}
        format="commander"
      />,
    );

    const commander = screen.getByRole("region", { name: "Comandante" });
    expect(within(commander).getByRole("link", { name: "Krenko, Mob Boss" })).toHaveAttribute(
      "href",
      "/cards/krenko",
    );

    const main = screen.getByRole("region", { name: "Mazo" });
    expect(within(main).getByRole("region", { name: "Instantáneos" })).toBeInTheDocument();
    expect(within(main).getByText("Tierras (98)")).toBeInTheDocument();

    // El banquillo está vacío: no se enseña. Las "quizás", sí.
    expect(screen.queryByRole("region", { name: "Banquillo" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Quizás" })).toBeInTheDocument();
  });

  it("valida el mazo con las reglas de su formato", () => {
    render(
      <DeckView
        lines={deck(
          { card: mountain, board: "main", quantity: 98, tags: [] },
          { card: island, board: "main", quantity: 1, tags: [] },
        )}
        format="commander"
      />,
    );

    expect(
      screen.getByText(/Fuera de la identidad de color del comandante: Island/),
    ).toBeInTheDocument();
  });

  it("cambia a imágenes sin perder las cartas", async () => {
    const user = userEvent.setup();
    render(
      <DeckView
        lines={deck({ card: bolt, board: "main", quantity: 4, tags: [] })}
        format="commander"
      />,
    );

    // En texto, cada línea lleva el precio de sus copias (4 × 1,50 €).
    const main = () => screen.getByRole("region", { name: "Mazo" });
    expect(within(main()).getByText(/6,00/)).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Imágenes" }));

    // En imágenes, la carta se ve y su cantidad va en una esquina.
    expect(screen.getByRole("img", { name: "Krenko, Mob Boss" })).toBeInTheDocument();
    expect(screen.getByLabelText("4 copias")).toBeInTheDocument();
    expect(within(main()).queryByText(/6,00/)).not.toBeInTheDocument();
  });

  it("avisa de las cartas que el catálogo todavía no conoce", () => {
    render(
      <DeckView
        lines={deck({ card: bolt, board: "main", quantity: 1, tags: [] })}
        format="commander"
        unknownCards={3}
      />,
    );

    expect(screen.getByText("3 sin datos")).toBeInTheDocument();
  });

  it("un mazo sin cartas lo dice, en vez de enseñar cero estadísticas", () => {
    render(<DeckView lines={[]} format="commander" />);

    expect(screen.getByText("Este mazo todavía no tiene cartas")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Mazo" })).not.toBeInTheDocument();
  });
});
