"use client";

import { FileText, ScanSearch } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useId, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormError, SelectField, TextField } from "@/components/ui/form-field";
import { toast } from "@/components/ui/toast";
import { routes } from "@/config/routes";
import {
  importDeckAction,
  previewDecklistAction,
  type DecklistPreview as Preview,
} from "../actions/import-actions";
import {
  DECK_BOARD_LABELS,
  DECK_BOARDS,
  DECK_FORMAT_LABELS,
  DECK_FORMATS,
  DECK_VISIBILITIES,
  DECK_VISIBILITY_LABELS,
} from "../constants/deck-formats";
import { MAX_DECK_NAME_LENGTH, MAX_DECKLIST_LENGTH } from "../constants/deck-limits";
import { countByBoard, parseDecklist } from "../lib/decklist-parser";
import type { DeckFormat, DeckVisibility } from "../types/deck";
import { DecklistPreview } from "./decklist-preview";

const PLACEHOLDER = `Commander
1 Krenko, Mob Boss

Deck
1 Sol Ring (C21) 263
1 Goblin Matron
30 Mountain`;

/**
 * Importar un mazo desde texto, en dos pasos: revisar (se buscan las cartas y se enseña qué
 * se ha encontrado) y crear. Mientras se escribe, el texto se interpreta en el navegador para
 * dar un recuento inmediato; buscar las cartas solo ocurre al pedir la revisión.
 */
export function ImportDeckForm() {
  const router = useRouter();
  const textId = useId();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<DeckFormat>("commander");
  const [visibility, setVisibility] = useState<DeckVisibility>("private");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<Preview>();
  const [error, setError] = useState<string>();
  const [isReviewing, startReview] = useTransition();
  const [isImporting, startImport] = useTransition();

  // Interpretar es barato, pero con listas largas no debe frenar la escritura.
  const deferredText = useDeferredValue(text);
  const parsed = useMemo(() => parseDecklist(deferredText, { format }), [deferredText, format]);
  const counts = countByBoard(parsed.lines);

  // Cambiar la lista o el formato deja la revisión anterior obsoleta.
  function changeList(value: string) {
    setText(value);
    setPreview(undefined);
  }
  function changeFormat(value: DeckFormat) {
    setFormat(value);
    setPreview(undefined);
  }

  function review() {
    setError(undefined);
    startReview(async () => {
      const result = await previewDecklistAction(text, format);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreview(result.preview);
      // El nombre que trae la lista (sección "About" de Arena) solo si no se ha escrito otro.
      if (!name.trim() && result.preview.deckName) setName(result.preview.deckName);
    });
  }

  function create() {
    if (!preview) return;
    setError(undefined);
    startImport(async () => {
      const result = await importDeckAction({
        name,
        format,
        visibility,
        entries: preview.entries.map(({ card, board, quantity }) => ({
          cardId: card.id,
          board,
          quantity,
        })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const copies = preview.entries.reduce((total, entry) => total + entry.quantity, 0);
      toast.success(`«${name.trim()}» importado con ${copies} cartas.`);
      router.push(routes.decks);
    });
  }

  const liveSummary = DECK_BOARDS.filter((board) => counts[board] > 0)
    .map((board) => `${DECK_BOARD_LABELS[board]} ${counts[board]}`)
    .join(" · ");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Nombre"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={MAX_DECK_NAME_LENGTH}
            placeholder="Krenko, goblins"
            autoComplete="off"
            className="sm:col-span-1"
          />
          <SelectField
            label="Formato"
            value={format}
            onChange={(event) => changeFormat(event.target.value as DeckFormat)}
          >
            {DECK_FORMATS.map((option) => (
              <option key={option} value={option}>
                {DECK_FORMAT_LABELS[option]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Visibilidad"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as DeckVisibility)}
          >
            {DECK_VISIBILITIES.map((option) => (
              <option key={option} value={option}>
                {DECK_VISIBILITY_LABELS[option]}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={textId} className="text-sm font-medium">
            Lista de cartas
          </label>
          <textarea
            id={textId}
            value={text}
            onChange={(event) => changeList(event.target.value)}
            maxLength={MAX_DECKLIST_LENGTH}
            placeholder={PLACEHOLDER}
            spellCheck={false}
            rows={18}
            className="w-full resize-y rounded-lg border border-border bg-surface p-3 font-mono text-sm leading-relaxed transition-colors duration-200 outline-none placeholder:text-muted/50 focus:border-accent"
          />
          <p className="min-h-5 text-xs text-muted" aria-live="polite">
            {parsed.lines.length === 0
              ? "Formatos de MTG Arena, MTGO y la mayoría de webs de mazos."
              : `${liveSummary}${
                  parsed.invalidLines.length > 0
                    ? ` · ${parsed.invalidLines.length} ${
                        parsed.invalidLines.length === 1
                          ? "línea sin entender"
                          : "líneas sin entender"
                      }`
                    : ""
                }`}
          </p>
        </div>

        {error && <FormError>{error}</FormError>}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant={preview ? "secondary" : "primary"}
            onClick={review}
            disabled={isReviewing || isImporting || parsed.lines.length === 0}
          >
            <ScanSearch className="size-4" aria-hidden />
            {isReviewing ? "Buscando cartas…" : preview ? "Volver a revisar" : "Revisar lista"}
          </Button>
          {preview && (
            <Button
              onClick={create}
              disabled={isImporting || preview.entries.length === 0 || !name.trim()}
              title={name.trim() ? undefined : "Ponle un nombre al mazo"}
            >
              {isImporting ? "Creando…" : "Crear mazo"}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <DecklistPreview preview={preview} format={format} />
            </motion.div>
          ) : (
            <motion.div
              key="help"
              initial={{ opacity: 0 }}
              animate={{ opacity: isReviewing ? 0.5 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3 text-sm text-muted"
            >
              <p className="flex items-center gap-2 font-medium text-foreground">
                <FileText className="size-4 text-accent" aria-hidden />
                Cómo importar
              </p>
              <p>
                Exporta el mazo como texto desde MTG Arena, MTGO, Moxfield o Archidekt y pégalo a la
                izquierda. Pulsa «Revisar lista» para comprobar las cartas antes de crear el mazo.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Una carta por línea: <code className="text-foreground">4 Lightning Bolt</code>,{" "}
                  <code className="text-foreground">4x Lightning Bolt</code> o solo el nombre.
                </li>
                <li>
                  Zonas con cabeceras (<code className="text-foreground">Commander</code>,{" "}
                  <code className="text-foreground">Deck</code>,{" "}
                  <code className="text-foreground">Sideboard</code>…) o, al estilo MTGO, con una
                  línea en blanco antes del banquillo.
                </li>
                <li>
                  Si la línea indica edición, <code className="text-foreground">(C21) 263</code>, se
                  respeta esa impresión.
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
