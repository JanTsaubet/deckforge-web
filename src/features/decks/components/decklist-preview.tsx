import { AlertTriangle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { ManaCost } from "@/features/cards/components/mana-cost";
import type { DecklistPreview as Preview } from "../actions/import-actions";
import { DECK_BOARD_LABELS, DECK_BOARDS } from "../constants/deck-formats";
import type { DeckFormat } from "../types/deck";

/** Un mazo de Commander tiene exactamente 100 cartas contando el comandante. */
const COMMANDER_DECK_SIZE = 100;

interface DecklistPreviewProps {
  preview: Preview;
  format: DeckFormat;
}

/** Resultado de revisar una lista: qué se ha encontrado, en qué zona, y qué no. */
export function DecklistPreview({ preview, format }: DecklistPreviewProps) {
  const found = preview.entries.reduce((total, entry) => total + entry.quantity, 0);
  const missing = preview.notFound.reduce((total, line) => total + line.quantity, 0);
  const playable = preview.entries
    .filter((entry) => entry.board === "commander" || entry.board === "main")
    .reduce((total, entry) => total + entry.quantity, 0);

  const problems = [
    ...preview.notFound.map((line) => ({
      lineNumber: line.lineNumber,
      text: `${line.quantity} ${line.name}`,
      reason: "no existe o está mal escrita",
    })),
    ...preview.invalidLines.map((line) => ({ ...line, reason: "no se entiende" })),
  ].sort((a, b) => a.lineNumber - b.lineNumber);

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        {missing === 0 ? (
          <CheckCircle2 className="size-4 text-success" aria-hidden />
        ) : (
          <AlertTriangle className="size-4 text-warning" aria-hidden />
        )}
        {missing === 0
          ? `Encontradas las ${found} cartas.`
          : `Encontradas ${found} de ${found + missing} cartas.`}
      </p>

      {problems.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          <p className="font-medium">Estas líneas no se importarán:</p>
          <ul className="mt-2 space-y-1">
            {problems.map((problem) => (
              <li key={problem.lineNumber} className="text-muted">
                <span className="text-foreground tabular-nums">Línea {problem.lineNumber}:</span> «
                {problem.text}» {problem.reason}.
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Corrígelas en el texto y vuelve a revisar, o importa sin ellas.
          </p>
        </div>
      )}

      {format === "commander" && playable !== COMMANDER_DECK_SIZE && (
        <p className="text-xs text-muted">
          Un mazo de Commander lleva {COMMANDER_DECK_SIZE} cartas con el comandante; este tiene{" "}
          {playable}. Puedes importarlo igualmente y ajustarlo en el editor.
        </p>
      )}

      {DECK_BOARDS.map((board) => {
        const entries = preview.entries.filter((entry) => entry.board === board);
        if (entries.length === 0) return null;
        const copies = entries.reduce((total, entry) => total + entry.quantity, 0);

        return (
          <section key={board} aria-label={DECK_BOARD_LABELS[board]}>
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
              {DECK_BOARD_LABELS[board]} ({copies})
            </h3>
            <ul className="divide-y divide-border/60">
              {entries.map((entry, index) => (
                <li
                  key={`${entry.card.id}-${index}`}
                  className="flex items-center gap-3 py-1.5 text-sm"
                >
                  <span className="w-6 text-right text-muted tabular-nums">{entry.quantity}</span>
                  {entry.card.imageUrl ? (
                    // `unoptimized`: las imágenes de Scryfall ya vienen optimizadas desde su CDN.
                    <Image
                      src={entry.card.imageUrl}
                      alt=""
                      width={24}
                      height={33}
                      unoptimized
                      // El reset de Tailwind pone `height: auto` a las imágenes: se fijan las dos
                      // medidas para que la miniatura no se deforme (y Next no avise).
                      className="h-[33px] w-6 rounded-sm object-cover"
                    />
                  ) : (
                    <span className="h-[33px] w-6 rounded-sm bg-surface-raised" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate" title={entry.card.typeLine}>
                    {entry.card.name}
                  </span>
                  {entry.card.manaCost && (
                    <ManaCost cost={entry.card.manaCost} className="shrink-0 [&_img]:size-4" />
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
