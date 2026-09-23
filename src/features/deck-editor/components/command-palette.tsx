"use client";

import { Command } from "cmdk";
import { Eye, History, Layers, Loader2, Redo2, Search, Undo2, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { MODAL_CLASSES } from "@/components/ui/modal-styles";
import { useModalDialog } from "@/components/ui/use-modal-dialog";
import { routes } from "@/config/routes";
import type { CatalogCard } from "@/features/decks/types/deck";
import { cn } from "@/lib/utils/cn";
import { normalizeText } from "@/lib/utils/text";
import { MIN_QUERY_LENGTH, useCatalogSearch } from "../hooks/use-catalog-search";
import { parseQuickAdd } from "../lib/quick-add";
import { useDeckEditor } from "../store/deck-editor-context";

interface CommandPaletteProps {
  deckId: string;
  /** Llevar el foco al buscador de la columna izquierda. */
  onFocusSearch: () => void;
  /** Abrir el historial de cambios del mazo. */
  onShowHistory: () => void;
  /** Botón que la abre, además del atajo: si no, solo la encontraría quien ya la conoce. */
  trigger?: (open: () => void) => ReactNode;
}

interface PaletteAction {
  id: string;
  label: string;
  /** Atajo equivalente, para irlo aprendiendo. */
  shortcut?: string;
  icon: LucideIcon;
  run: () => void;
  enabled?: boolean;
}

const PALETTE_CLASSES = cn(
  MODAL_CLASSES,
  "mt-[12vh] mb-auto max-w-xl overflow-hidden p-0 sm:mt-[15vh]",
);

const ITEM_CLASSES =
  "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors duration-100 data-[selected=true]:bg-surface";

/**
 * Paleta de comandos del editor (Ctrl+K): escribir el nombre de una carta la añade al mazo,
 * y lo demás son las acciones de la pantalla, encontrables sin recordar dónde está cada botón.
 *
 * A diferencia del buscador de la izquierda, aquí no se filtra por la identidad de color del
 * comandante: la paleta es el camino rápido para quien ya sabe qué carta quiere, también si
 * va al banquillo. Lo que se añada fuera de la identidad lo avisará la validación.
 */
export function CommandPalette({
  deckId,
  onFocusSearch,
  onShowHistory,
  trigger,
}: CommandPaletteProps) {
  const dialog = useModalDialog();
  const router = useRouter();
  const [text, setText] = useState("");

  const addCopies = useDeckEditor((state) => state.addCopies);
  const undo = useDeckEditor((state) => state.undo);
  const redo = useDeckEditor((state) => state.redo);
  const canUndo = useDeckEditor((state) => state.past.length > 0);
  const canRedo = useDeckEditor((state) => state.future.length > 0);

  const { quantity, query } = parseQuickAdd(text);
  const search = useCatalogSearch(query, undefined);
  const cards = query.length >= MIN_QUERY_LENGTH ? (search.data ?? []) : [];

  // Ctrl+K (o Cmd+K) abre y cierra. Se escucha en toda la ventana, también desde un campo de
  // texto: es el atajo que más se usa y tiene que funcionar siempre.
  const { isOpen, open, close } = dialog;
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isOpen) close();
        else open();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, open, close]);

  /** Toda acción de la paleta cierra la paleta y deja la pantalla lista para lo siguiente. */
  function run(action: () => void) {
    action();
    setText("");
    close();
  }

  function addCard(card: CatalogCard) {
    run(() => addCopies(card, "main", quantity));
  }

  const actions: PaletteAction[] = [
    { id: "undo", label: "Deshacer", shortcut: "Ctrl+Z", icon: Undo2, run: undo, enabled: canUndo },
    {
      id: "redo",
      label: "Rehacer",
      shortcut: "Ctrl+Shift+Z",
      icon: Redo2,
      run: redo,
      enabled: canRedo,
    },
    {
      id: "search",
      label: "Buscar cartas para añadir",
      shortcut: "/",
      icon: Search,
      run: onFocusSearch,
    },
    {
      id: "history",
      label: "Ver el historial de cambios",
      icon: History,
      run: onShowHistory,
    },
    {
      id: "view",
      label: "Ver el mazo como lo ven los demás",
      icon: Eye,
      run: () => router.push(routes.deck(deckId)),
    },
    { id: "library", label: "Ir a mis mazos", icon: Layers, run: () => router.push(routes.decks) },
  ];

  const needle = normalizeText(text);
  const visibleActions = actions.filter(
    (action) => (action.enabled ?? true) && normalizeText(action.label).includes(needle),
  );

  return (
    <>
      {trigger?.(open)}
      <dialog {...dialog.dialogProps} aria-label="Paleta de comandos" className={PALETTE_CLASSES}>
        <Command label="Paleta de comandos" shouldFilter={false} className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="size-4 shrink-0 text-muted" aria-hidden />
            <Command.Input
              autoFocus
              value={text}
              onValueChange={setText}
              placeholder="Busca una carta («4 Sol Ring») o una acción…"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60"
            />
            {search.isFetching && (
              <Loader2 className="size-4 animate-spin text-muted" aria-hidden />
            )}
          </div>

          <Command.List className="max-h-[50vh] overflow-y-auto overscroll-contain p-2">
            <Command.Empty className="px-2 py-6 text-center text-sm text-muted">
              {query.length >= MIN_QUERY_LENGTH && !search.isFetching
                ? `Ninguna carta ni acción con «${query}».`
                : "Escribe para buscar una carta o una acción."}
            </Command.Empty>

            {cards.length > 0 && (
              <Command.Group
                heading="Cartas"
                className="mb-1 text-xs text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1"
              >
                {cards.map((card) => (
                  <Command.Item
                    key={card.id}
                    value={card.id}
                    onSelect={() => addCard(card)}
                    className={ITEM_CLASSES}
                  >
                    {card.imageSmall ? (
                      // `unoptimized`: las imágenes de Scryfall ya vienen optimizadas desde su CDN.
                      <Image
                        src={card.imageSmall}
                        alt=""
                        width={28}
                        height={39}
                        unoptimized
                        className="h-[39px] w-7 shrink-0 rounded-sm object-cover"
                      />
                    ) : (
                      <span className="h-[39px] w-7 shrink-0 rounded-sm bg-surface" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">{card.name}</span>
                      <span className="block truncate text-xs text-muted">{card.typeLine}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      Añadir {quantity > 1 && `${quantity} `}al mazo
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {visibleActions.length > 0 && (
              <Command.Group
                heading="Acciones"
                className="text-xs text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1"
              >
                {visibleActions.map(({ id, label, shortcut, icon: Icon, run: action }) => (
                  <Command.Item
                    key={id}
                    value={id}
                    onSelect={() => run(action)}
                    className={ITEM_CLASSES}
                  >
                    <Icon className="size-4 shrink-0 text-muted" aria-hidden />
                    <span className="flex-1 text-foreground">{label}</span>
                    {shortcut && <kbd className="shrink-0 text-xs text-muted">{shortcut}</kbd>}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </dialog>
    </>
  );
}
