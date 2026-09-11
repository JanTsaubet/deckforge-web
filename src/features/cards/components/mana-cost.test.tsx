import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ManaCost } from "./mana-cost";

describe("ManaCost", () => {
  it("representa un símbolo por cada elemento del coste", () => {
    const { container } = render(<ManaCost cost="{2}{G}{G}" />);

    expect(container.querySelectorAll("span[aria-hidden]")).toHaveLength(3);
  });

  it("describe el coste completo para lectores de pantalla", () => {
    render(<ManaCost cost="{1}{U}" />);

    expect(screen.getByLabelText("Coste de maná: {1}{U}")).toBeInTheDocument();
  });

  it("no pinta nada cuando la carta no tiene coste", () => {
    const { container } = render(<ManaCost cost="" />);

    expect(container).toBeEmptyDOMElement();
  });
});
