import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ColorIdentity } from "./color-identity";

describe("ColorIdentity", () => {
  it("pinta un símbolo por color y se describe en palabras", () => {
    const { container } = render(<ColorIdentity colors={["W", "B"]} />);

    expect(screen.getByRole("img", { name: "Colores: Blanco, Negro" })).toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(2);
  });

  it("sin colores no pinta nada (puede ser incoloro o aún sin catálogo)", () => {
    const { container } = render(<ColorIdentity colors={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
