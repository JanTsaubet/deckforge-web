import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ManaCost } from "./mana-cost";

describe("ManaCost", () => {
  it("dibuja un símbolo oficial por cada elemento del coste", () => {
    const { container } = render(<ManaCost cost="{2}{G}{G}" />);
    const icons = container.querySelectorAll("img");

    expect(icons).toHaveLength(3);
    expect(icons[1]?.getAttribute("src")).toBe("https://svgs.scryfall.io/card-symbols/G.svg");
  });

  it("describe el coste completo para lectores de pantalla", () => {
    render(<ManaCost cost="{1}{U}" />);

    expect(screen.getByRole("img", { name: "Coste de maná: {1}{U}" })).toBeInTheDocument();
  });

  it("no pinta nada cuando la carta no tiene coste", () => {
    const { container } = render(<ManaCost cost="" />);

    expect(container).toBeEmptyDOMElement();
  });
});
