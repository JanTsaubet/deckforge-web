"use client";

import { ArrowLeft, Check, CloudOff, Eye, Loader2, Redo2, Undo2 } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { ColorIdentity } from "@/features/cards/components/color-identity";
import type { ManaColor } from "@/features/cards/types/card";
import { DECK_FORMAT_LABELS } from "@/features/decks/constants/deck-formats";
import type { DeckFormat } from "@/features/decks/types/deck";
import { cn } from "@/lib/utils/cn";
import { useDeckEditor } from "../store/deck-editor-context";

interface EditorHeaderProps {
  deckId: string;
  name: string;
  format: DeckFormat;
  identity?: ManaColor[];
}

const ICON_BUTTON =
  "grid size-9 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-surface-raised hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

/** Cabecera del editor: el mazo, el estado del guardado y deshacer/rehacer. */
export function EditorHeader({ deckId, name, format, identity }: EditorHeaderProps) {
  const canUndo = useDeckEditor((state) => state.past.length > 0);
  const canRedo = useDeckEditor((state) => state.future.length > 0);
  const undo = useDeckEditor((state) => state.undo);
  const redo = useDeckEditor((state) => state.redo);

  return (
    <header className="flex flex-wrap items-center gap-3">
      <Link href={routes.decks} aria-label="Volver a mis mazos" className={ICON_BUTTON}>
        <ArrowLeft className="size-4" aria-hidden />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="flex items-center gap-2 truncate text-xl font-semibold tracking-tight">
          <span className="truncate">{name}</span>
          {identity && <ColorIdentity colors={identity} className="shrink-0" />}
        </h1>
        <p className="text-xs text-muted">{DECK_FORMAT_LABELS[format]}</p>
      </div>

      <SaveIndicator />

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          aria-label="Deshacer"
          title="Deshacer (Ctrl+Z)"
          className={ICON_BUTTON}
        >
          <Undo2 className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          aria-label="Rehacer"
          title="Rehacer (Ctrl+Shift+Z)"
          className={ICON_BUTTON}
        >
          <Redo2 className="size-4" aria-hidden />
        </button>
      </div>
      <Link
        href={routes.deck(deckId)}
        className={buttonStyles({ variant: "secondary", size: "sm" })}
      >
        <Eye className="size-4" aria-hidden />
        Ver
      </Link>
    </header>
  );
}

/** Estado del guardado automático, anunciado a los lectores de pantalla cuando cambia. */
function SaveIndicator() {
  const status = useDeckEditor((state) => state.saveStatus);
  const error = useDeckEditor((state) => state.saveError);
  const retry = useDeckEditor((state) => state.retrySave);

  return (
    <div role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs text-muted">
      {status === "saved" && (
        <>
          <Check className="size-3.5 text-success" aria-hidden />
          Guardado
        </>
      )}
      {(status === "pending" || status === "saving") && (
        <>
          <Loader2 className={cn("size-3.5", status === "saving" && "animate-spin")} aria-hidden />
          {status === "saving" ? "Guardando…" : "Cambios sin guardar"}
        </>
      )}
      {status === "error" && (
        <>
          <CloudOff className="size-3.5 text-danger" aria-hidden />
          <span className="text-danger" title={error}>
            No se ha guardado
          </span>
          <button
            type="button"
            onClick={retry}
            className="text-accent underline-offset-2 hover:underline"
          >
            Reintentar
          </button>
        </>
      )}
    </div>
  );
}
