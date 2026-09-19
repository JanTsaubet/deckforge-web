import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { TagInput } from "./tag-input";

/** El componente es controlado: este envoltorio guarda las etiquetas como lo haría un formulario. */
function Harness({ initial = [], maxTags = 10 }: { initial?: string[]; maxTags?: number }) {
  const [tags, setTags] = useState(initial);
  return (
    <TagInput
      label="Etiquetas"
      value={tags}
      onChange={setTags}
      maxTags={maxTags}
      maxLength={30}
      normalize={(tag) => tag.trim().toLowerCase()}
    />
  );
}

const tagNames = () =>
  screen
    .queryAllByRole("button", { name: /^Quitar la etiqueta/ })
    .map((button) => button.getAttribute("aria-label")?.replace("Quitar la etiqueta ", ""));

describe("TagInput", () => {
  it("añade con Enter y con coma, normalizando y sin repetir", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Etiquetas"), " Goblins {Enter}Tokens,goblins,");

    expect(tagNames()).toEqual(["goblins", "tokens"]);
    expect(screen.getByLabelText("Etiquetas")).toHaveValue("");
  });

  it("al pegar una lista separada por comas crea todas las etiquetas", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByLabelText("Etiquetas"));
    await user.paste("ramp, removal, draw");

    // Lo que va tras la última coma queda como borrador, por si se sigue escribiendo.
    expect(tagNames()).toEqual(["ramp", "removal"]);
    expect(screen.getByLabelText("Etiquetas")).toHaveValue(" draw");
  });

  it("Retroceso con el campo vacío quita la última etiqueta", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["cedh", "stax"]} />);

    await user.type(screen.getByLabelText("Etiquetas"), "{Backspace}");

    // La etiqueta sale con una animación: sigue en el DOM hasta que termina.
    await waitFor(() => expect(tagNames()).toEqual(["cedh"]));
  });

  it("no pasa del máximo de etiquetas", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["a"]} maxTags={2} />);

    await user.type(screen.getByLabelText("Etiquetas"), "b,c,");

    expect(tagNames()).toEqual(["a", "b"]);
  });

  it("cada etiqueta se quita con su botón", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["cedh", "stax"]} />);

    await user.click(screen.getByRole("button", { name: "Quitar la etiqueta cedh" }));

    await waitFor(() => expect(tagNames()).toEqual(["stax"]));
  });
});
