"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FormError, SelectField, TextField } from "@/components/ui/form-field";
import { MODAL_CLASSES } from "@/components/ui/modal-styles";
import { toast } from "@/components/ui/toast";
import { createDeckAction, type DeckActionResult } from "../actions/deck-actions";
import {
  DECK_FORMAT_LABELS,
  DECK_FORMATS,
  DECK_VISIBILITIES,
  DECK_VISIBILITY_LABELS,
} from "../constants/deck-formats";

interface CreateDeckDialogProps {
  triggerLabel?: string;
}

/**
 * Diálogo para crear un mazo, sobre el elemento nativo <dialog>: el navegador ya atrapa el
 * foco, cierra con Escape y deja inerte el resto de la página.
 */
export function CreateDeckDialog({ triggerLabel = "Nuevo mazo" }: CreateDeckDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();

  const [state, formAction, isPending] = useActionState(
    async (previous: DeckActionResult | null, formData: FormData) => {
      const result = await createDeckAction(previous, formData);
      if (result.ok) {
        toast.success(`«${String(formData.get("name")).trim()}» creado.`);
        formRef.current?.reset();
        dialogRef.current?.close();
      }
      return result;
    },
    null,
  );

  const close = () => dialogRef.current?.close();

  return (
    <>
      <Button onClick={() => dialogRef.current?.showModal()}>
        <Plus className="size-4" aria-hidden />
        {triggerLabel}
      </Button>

      <dialog ref={dialogRef} aria-labelledby={titleId} className={MODAL_CLASSES}>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <header className="flex items-center justify-between">
            <h2 id={titleId} className="text-lg font-semibold">
              Nuevo mazo
            </h2>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={close}
              className="rounded p-1 text-muted transition-colors duration-200 hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <TextField
            label="Nombre"
            name="name"
            required
            maxLength={100}
            placeholder="Atraxa, superamigos"
            autoComplete="off"
          />

          <SelectField label="Formato" name="format" defaultValue="commander">
            {DECK_FORMATS.map((format) => (
              <option key={format} value={format}>
                {DECK_FORMAT_LABELS[format]}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Visibilidad"
            name="visibility"
            defaultValue="private"
            hint="Puedes cambiarla cuando quieras."
          >
            {DECK_VISIBILITIES.map((visibility) => (
              <option key={visibility} value={visibility}>
                {DECK_VISIBILITY_LABELS[visibility]}
              </option>
            ))}
          </SelectField>

          {state?.ok === false && <FormError>{state.error}</FormError>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando…" : "Crear mazo"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
