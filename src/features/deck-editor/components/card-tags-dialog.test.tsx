import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import type { DeckCardLine } from "@/features/decks/types/deck";
import { catalogCard } from "@/test/fixtures/catalog-card";
import { DeckEditorProvider, useDeckEditorStoreApi } from "../store/deck-editor-context";
import type { DeckEditorStoreApi } from "../store/deck-editor-store";
import { CardTagsDialog } from "./card-tags-dialog";

const sol = catalogCard({ id: "sol", name: "Sol Ring", typeLine: "Artifact" });
const line: DeckCardLine = { card: sol, board: "main", quantity: 1, tags: ["rampa"] };

let store: DeckEditorStoreApi;

function Probe({ onReady }: { onReady: (api: DeckEditorStoreApi) => void }) {
  const api = useDeckEditorStoreApi();
  useEffect(() => {
    onReady(api);
  }, [api, onReady]);
  return null;
}

/** El diálogo lee la carta del store: se le pasa siempre la línea actual, como en la lista. */
function Row() {
  const api = useDeckEditorStoreApi();
  const entry = api.getState().entries[0] ?? line;
  return (
    <CardTagsDialog
      entry={entry}
      deckTags={["tutor"]}
      trigger={(open) => (
        <button type="button" onClick={open}>
          Etiquetar
        </button>
      )}
    />
  );
}

function setup() {
  render(
    <DeckEditorProvider initialEntries={[line]}>
      <Probe onReady={(api) => (store = api)} />
      <Row />
    </DeckEditorProvider>,
  );
  return userEvent.setup();
}

const tagsInStore = () => store.getState().entries[0]?.tags;

describe("CardTagsDialog", () => {
  it("parte de las etiquetas de la carta y guarda los cambios en el mazo", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Etiquetar" }));

    await user.type(screen.getByLabelText("Etiquetas de la carta"), "Artefacto{Enter}");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(tagsInStore()).toEqual(["rampa", "artefacto"]);
    // Es un cambio más del editor: queda pendiente de guardar y se puede deshacer.
    expect(store.getState().saveStatus).toBe("pending");
  });

  it("cancelar no cambia nada", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Etiquetar" }));

    await user.click(screen.getByRole("button", { name: "Quitar la etiqueta rampa" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(tagsInStore()).toEqual(["rampa"]);
    expect(store.getState().saveStatus).toBe("saved");
  });

  it("se puede usar aunque las acciones de la fila estén apagadas", async () => {
    // En la lista, los botones de una carta viven en un grupo con `pointer-events: none` hasta
    // que el ratón pasa por la fila. Al abrirse el diálogo el cursor sale de ella, así que el
    // diálogo no puede colgar de ese grupo: se monta aparte, al final del <body>.
    const user = userEvent.setup();
    const { container } = render(
      <DeckEditorProvider initialEntries={[line]}>
        <div style={{ pointerEvents: "none" }}>
          <Row />
        </div>
      </DeckEditorProvider>,
    );

    // El grupo se vuelve pulsable al pasar el ratón; el clic del test no lo simula.
    fireEvent.click(screen.getByRole("button", { name: "Etiquetar" }));

    const dialog = screen.getByRole("dialog");
    expect(container).not.toContainElement(dialog);
    // Con el diálogo dentro del grupo, este clic era imposible: ni se podía cerrar.
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(dialog).not.toBeVisible();
  });

  it("sugiere primero las etiquetas del mazo y después las funciones habituales", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Etiquetar" }));

    // El autocompletado es un <datalist> nativo: sus opciones son lo que ofrece el navegador.
    const input = screen.getByLabelText("Etiquetas de la carta");
    const listId = input.getAttribute("list");
    const options = [...document.querySelectorAll(`#${CSS.escape(listId ?? "")} option`)].map(
      (option) => option.getAttribute("value"),
    );

    expect(options[0]).toBe("tutor");
    expect(options).toEqual(expect.arrayContaining(["robo", "remoción"]));
    // La que ya tiene la carta no se vuelve a ofrecer.
    expect(options).not.toContain("rampa");
  });
});
