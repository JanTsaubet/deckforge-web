"use client";

import { History, Minus, Plus, X } from "lucide-react";
import { useId } from "react";
import { MODAL_CLASSES } from "@/components/ui/modal-styles";
import { Skeleton } from "@/components/ui/skeleton";
import type { ModalDialog } from "@/components/ui/use-modal-dialog";
import { DECK_BOARD_LABELS } from "@/features/decks/constants/deck-formats";
import { cn } from "@/lib/utils/cn";
import { formatRelativeDate } from "@/lib/utils/format-date";
import type { DeckVersion, DeckVersionChange } from "../api/deck-versions";
import { useDeckVersions } from "../hooks/use-deck-versions";

interface HistoryDialogProps {
  deckId: string;
  /** El estado lo lleva la cabecera: el historial se abre con su botón y desde la paleta. */
  dialog: ModalDialog;
}

const DIALOG_CLASSES = cn(MODAL_CLASSES, "max-w-2xl p-0");

/**
 * Historial de cambios del mazo: qué cartas entraron y salieron, y cuándo. Los cambios
 * seguidos se guardan juntos, así que cada entrada es una tanda de edición y no cada vez que
 * el guardado automático hizo su trabajo.
 */
export function HistoryDialog({ deckId, dialog }: HistoryDialogProps) {
  const titleId = useId();
  const versions = useDeckVersions(deckId, dialog.isOpen);

  return (
    <dialog {...dialog.dialogProps} aria-labelledby={titleId} className={DIALOG_CLASSES}>
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <h2 id={titleId} className="flex items-center gap-2 text-lg font-semibold">
          <History className="size-5 shrink-0 text-accent" aria-hidden />
          Historial de cambios
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

      <div className="max-h-[60vh] overflow-y-auto overscroll-contain px-5 py-4">
        {versions.isPending && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-20" />
            ))}
          </div>
        )}

        {versions.isError && (
          <p className="text-sm text-muted">
            No se ha podido cargar el historial. Vuelve a abrirlo en un momento.
          </p>
        )}

        {versions.data?.length === 0 && (
          <p className="text-sm text-muted">
            Todavía no hay cambios guardados. En cuanto añadas o quites cartas, aquí quedará lo que
            cambió y cuándo.
          </p>
        )}

        {versions.data && versions.data.length > 0 && (
          <ol className="flex flex-col gap-5">
            {versions.data.map((version) => (
              <Version key={version.id} version={version} />
            ))}
          </ol>
        )}
      </div>
    </dialog>
  );
}

/** Una tanda de cambios: cuándo fue, el resumen de copias y qué cartas cambiaron. */
function Version({ version }: { version: DeckVersion }) {
  const added = version.changes.reduce(
    (total, change) => total + Math.max(change.to - change.from, 0),
    0,
  );
  const removed = version.changes.reduce(
    (total, change) => total + Math.max(change.from - change.to, 0),
    0,
  );

  return (
    <li className="flex flex-col gap-1.5">
      <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm font-medium">
        {/* El título es la fecha; el momento exacto queda en el `title` y en `dateTime`. */}
        <time dateTime={version.createdAt} title={new Date(version.createdAt).toLocaleString("es")}>
          {capitalize(formatRelativeDate(version.createdAt))}
        </time>
        <span className="text-xs font-normal text-muted tabular-nums">
          {added > 0 && <span className="text-success">+{added}</span>}
          {added > 0 && removed > 0 && " · "}
          {removed > 0 && <span className="text-danger">−{removed}</span>}
        </span>
      </h3>

      <ul className="flex flex-col gap-0.5 border-l border-border pl-3">
        {version.changes.map((change) => (
          <Change key={`${change.board}:${change.cardId}`} change={change} />
        ))}
      </ul>
    </li>
  );
}

function Change({ change }: { change: DeckVersionChange }) {
  const delta = change.to - change.from;
  const grew = delta > 0;
  const Icon = grew ? Plus : Minus;

  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={cn(
          "flex w-9 shrink-0 items-center justify-end gap-0.5 font-medium tabular-nums",
          grew ? "text-success" : "text-danger",
        )}
      >
        <Icon className="size-3" aria-hidden />
        {Math.abs(delta)}
      </span>
      <span className="min-w-0 flex-1 truncate">
        {change.card?.name ?? "Carta que ya no está en el catálogo"}
      </span>
      {/* Solo se dice la zona cuando no es el mazo principal, que es donde va casi todo. */}
      {change.board !== "main" && (
        <span className="shrink-0 text-xs text-muted">{DECK_BOARD_LABELS[change.board]}</span>
      )}
      {/* Una carta que ya estaba: de cuántas copias a cuántas. */}
      {change.from > 0 && change.to > 0 && (
        <span className="shrink-0 text-xs text-muted tabular-nums">
          {change.from} → {change.to}
        </span>
      )}
    </li>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
