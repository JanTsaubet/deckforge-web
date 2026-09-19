"use client";

import { FolderInput, X } from "lucide-react";
import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FormError, SelectField } from "@/components/ui/form-field";
import { MODAL_CLASSES } from "@/components/ui/modal-styles";
import { TagInput } from "@/components/ui/tag-input";
import { toast } from "@/components/ui/toast";
import { useModalDialog } from "@/components/ui/use-modal-dialog";
import { organizeDeckAction } from "../actions/deck-actions";
import { MAX_DECK_TAGS, MAX_TAG_LENGTH, normalizeTag } from "../constants/deck-limits";
import type { DeckFolder, DeckSummary } from "../types/deck";

interface OrganizeDeckDialogProps {
  deck: Pick<DeckSummary, "id" | "name" | "folderId" | "tags">;
  folders: DeckFolder[];
  /** Etiquetas usadas en la biblioteca, para autocompletar. */
  knownTags: string[];
  trigger: (open: () => void) => ReactNode;
}

/** Carpeta y etiquetas de un mazo: todo lo que sirve para ordenar la biblioteca. */
export function OrganizeDeckDialog({ deck, folders, knownTags, trigger }: OrganizeDeckDialogProps) {
  const dialog = useModalDialog();
  const titleId = useId();
  const [folderId, setFolderId] = useState(deck.folderId ?? "");
  const [tags, setTags] = useState(deck.tags);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  // Cada vez que se abre, parte de lo guardado: descarta lo que se dejó a medias.
  function open() {
    setFolderId(deck.folderId ?? "");
    setTags(deck.tags);
    setError(undefined);
    dialog.open();
  }

  function save(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await organizeDeckAction(deck.id, { folderId: folderId || null, tags });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(`«${deck.name}» organizado.`);
      dialog.close();
    });
  }

  return (
    <>
      {trigger(open)}
      <dialog {...dialog.dialogProps} aria-labelledby={titleId} className={MODAL_CLASSES}>
        <form onSubmit={save} className="flex flex-col gap-4">
          <header className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="flex min-w-0 items-center gap-2 text-lg font-semibold">
              <FolderInput className="size-5 shrink-0 text-accent" aria-hidden />
              <span className="truncate">Organizar «{deck.name}»</span>
            </h2>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={dialog.close}
              className="rounded p-1 text-muted transition-colors duration-200 hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <SelectField
            label="Carpeta"
            value={folderId}
            onChange={(event) => setFolderId(event.target.value)}
            hint={
              folders.length === 0 ? "Crea carpetas desde el panel de la biblioteca." : undefined
            }
          >
            <option value="">Sin carpeta</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </SelectField>

          <TagInput
            label="Etiquetas"
            value={tags}
            onChange={setTags}
            suggestions={knownTags}
            maxTags={MAX_DECK_TAGS}
            maxLength={MAX_TAG_LENGTH}
            normalize={normalizeTag}
          />

          {error && <FormError>{error}</FormError>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={dialog.close}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
