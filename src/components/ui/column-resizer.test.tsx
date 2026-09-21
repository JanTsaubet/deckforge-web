import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColumnResizer } from "./column-resizer";

function setup(value?: number) {
  const onResize = vi.fn();
  const onResizeEnd = vi.fn();
  const onReset = vi.fn();
  render(
    <ColumnResizer
      label="Ancho del buscador"
      side="left"
      value={value}
      min={200}
      max={() => 400}
      onResize={onResize}
      onResizeEnd={onResizeEnd}
      onReset={onReset}
    />,
  );
  const handle = screen.getByRole("separator", { name: "Ancho del buscador" });
  return { handle, onResize, onResizeEnd, onReset, user: userEvent.setup() };
}

describe("ColumnResizer", () => {
  it("con las flechas ensancha y estrecha la columna, y lo guarda", async () => {
    const { handle, onResizeEnd, user } = setup(300);
    handle.focus();

    await user.keyboard("{ArrowRight}");
    expect(onResizeEnd).toHaveBeenLastCalledWith(316);

    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(onResizeEnd).toHaveBeenLastCalledWith(236);
  });

  it("no pasa del mínimo ni del máximo", async () => {
    const { handle, onResizeEnd, user } = setup(390);
    handle.focus();

    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(onResizeEnd).toHaveBeenLastCalledWith(400);

    await user.keyboard("{Home}");
    expect(onResizeEnd).toHaveBeenLastCalledWith(200);

    await user.keyboard("{End}");
    expect(onResizeEnd).toHaveBeenLastCalledWith(400);
  });

  it("la columna de la derecha crece al mover el asa hacia la izquierda", async () => {
    const onResizeEnd = vi.fn();
    render(
      <ColumnResizer
        label="Ancho del análisis"
        side="right"
        value={300}
        min={200}
        max={() => 400}
        onResize={vi.fn()}
        onResizeEnd={onResizeEnd}
        onReset={vi.fn()}
      />,
    );
    const handle = screen.getByRole("separator", { name: "Ancho del análisis" });
    handle.focus();

    await userEvent.setup().keyboard("{ArrowLeft}");

    expect(onResizeEnd).toHaveBeenLastCalledWith(316);
  });

  it("doble clic vuelve al ancho de siempre", () => {
    const { handle, onReset } = setup(300);

    fireEvent.doubleClick(handle);

    expect(onReset).toHaveBeenCalled();
  });

  it("dice a los lectores de pantalla cuánto mide", () => {
    const { handle } = setup(300);

    expect(handle).toHaveAttribute("aria-valuenow", "300");
    expect(handle).toHaveAttribute("aria-valuetext", "300 píxeles");
  });
});
