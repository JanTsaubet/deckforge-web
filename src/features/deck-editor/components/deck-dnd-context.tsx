"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Active,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type ScreenReaderInstructions,
} from "@dnd-kit/core";
import { useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { DECK_BOARD_LABELS } from "@/features/decks/constants/deck-formats";
import type { DeckBoard } from "@/features/decks/types/deck";
import {
  dragCard,
  zoneCollisionDetection,
  zoneCoordinateGetter,
  type DragCard,
} from "../lib/drag-and-drop";
import { useDeckEditor } from "../store/deck-editor-context";

const instructions: ScreenReaderInstructions = {
  draggable:
    "Pulsa espacio para coger la carta. Muévela entre zonas con las flechas y suéltala con espacio. Escape cancela.",
};

/** Cada paso del arrastre se cuenta en voz alta: es la única forma de seguirlo sin ver. */
const announcements: Announcements = {
  onDragStart: ({ active }) => `Has cogido ${name(active)}.`,
  onDragOver: ({ active, over }) =>
    over
      ? `${name(active)} está sobre ${zone(String(over.id))}.`
      : `${name(active)} está fuera de las zonas del mazo.`,
  onDragEnd: ({ active, over }) =>
    over
      ? `${name(active)} se ha movido a ${zone(String(over.id))}.`
      : `${name(active)} se queda donde estaba.`,
  onDragCancel: ({ active }) => `Movimiento cancelado: ${name(active)} se queda donde estaba.`,
};

function name(active: Active | null): string {
  return dragCard(active)?.card.name ?? "la carta";
}

function zone(board: string): string {
  return DECK_BOARD_LABELS[board as DeckBoard] ?? board;
}

/**
 * Arrastrar cartas de una zona a otra. Envuelve al editor entero para que, mientras se
 * arrastra, las zonas sepan qué carta viene y puedan aceptarla o no (al hueco de comandante
 * solo entra lo que puede serlo).
 *
 * El arrastre no empieza hasta mover 6 píxeles: así los botones de cada fila siguen siendo
 * botones y un clic no mueve nada sin querer.
 */
export function DeckDndContext({ children }: { children: ReactNode }) {
  const moveCard = useDeckEditor((state) => state.moveCard);
  const [dragging, setDragging] = useState<DragCard>();
  const reduceMotion = useReducedMotion();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: zoneCoordinateGetter }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    setDragging(dragCard(active));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDragging(undefined);
    const dragged = dragCard(active);
    const target = over ? (String(over.id) as DeckBoard) : undefined;
    if (!dragged || !target || target === dragged.board) return;
    moveCard(dragged.card, dragged.board, target);
  }

  return (
    <DndContext
      // Identificador fijo: dnd-kit numera sus elementos de accesibilidad a partir de él y,
      // sin uno, el servidor y el navegador pintan números distintos (fallo de hidratación).
      id="editor-de-mazo"
      sensors={sensors}
      collisionDetection={zoneCollisionDetection}
      accessibility={{ announcements, screenReaderInstructions: instructions }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragging(undefined)}
    >
      {children}
      {/* La carta sigue al cursor por encima de todo, mientras la fila original se queda atenuada. */}
      <DragOverlay dropAnimation={reduceMotion ? null : undefined}>
        {dragging && (
          <div className="pointer-events-none flex h-8 items-center gap-2 rounded-md border border-accent/60 bg-surface-raised px-2 text-sm shadow-xl">
            <span className="text-muted tabular-nums">{dragging.quantity}</span>
            <span className="max-w-60 truncate">{dragging.card.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
