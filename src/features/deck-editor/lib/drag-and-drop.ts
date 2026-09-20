import { KeyboardCode, type Active, type KeyboardCoordinateGetter } from "@dnd-kit/core";
import { canBeCommander } from "@/features/decks/lib/deck-validation";
import type { CatalogCard, DeckBoard } from "@/features/decks/types/deck";

/** Lo que viaja con una carta mientras se arrastra; las zonas lo leen para decidir si la admiten. */
export interface DragCard {
  card: CatalogCard;
  board: DeckBoard;
  quantity: number;
}

/**
 * Lee la carta que se está arrastrando. dnd-kit no tipa `data` (ahí puede ir cualquier cosa),
 * así que se comprueba antes de darla por buena.
 */
export function dragCard(active: Active | null | undefined): DragCard | undefined {
  const data = active?.data.current;
  if (!data || typeof data !== "object" || !("card" in data) || !("board" in data))
    return undefined;
  return data as DragCard;
}

interface AcceptOptions {
  /** El formato tiene zona de comandante. */
  hasCommander: boolean;
  /** Comandantes ya elegidos. */
  commanderCount: number;
}

/** Como mucho dos comandantes (con Partner); el tercero no cabe. */
export const MAX_COMMANDERS = 2;

/**
 * ¿Admite esta zona la carta que se está arrastrando? Soltarla en su propia zona no haría
 * nada, y en el hueco de comandante solo entra lo que puede serlo y mientras quede sitio:
 * las zonas que no la admiten ni se iluminan ni la aceptan.
 */
export function acceptsCard(
  board: DeckBoard,
  dragged: DragCard | undefined,
  { hasCommander, commanderCount }: AcceptOptions,
): boolean {
  if (!dragged || dragged.board === board) return false;
  if (board !== "commander") return true;
  return hasCommander && commanderCount < MAX_COMMANDERS && canBeCommander(dragged.card);
}

const NEXT_ZONE = [KeyboardCode.Down, KeyboardCode.Right];
const PREVIOUS_ZONE = [KeyboardCode.Up, KeyboardCode.Left];

/**
 * Con el teclado, cada flecha lleva la carta a la zona siguiente o a la anterior, dando la
 * vuelta al llegar al final. Por defecto dnd-kit mueve 25 píxeles por pulsación, lo que
 * obligaría a aporrear la flecha hasta cruzar media pantalla: aquí lo que se mueve son zonas,
 * que es como se piensa el movimiento ("esta carta, al banquillo").
 *
 * Solo entran las zonas que admiten la carta, así que nunca se para en una que la rechazaría.
 */
export const zoneCoordinateGetter: KeyboardCoordinateGetter = (
  event,
  { context: { collisionRect, droppableContainers, droppableRects } },
) => {
  const step = NEXT_ZONE.includes(event.code as KeyboardCode)
    ? 1
    : PREVIOUS_ZONE.includes(event.code as KeyboardCode)
      ? -1
      : 0;
  if (step === 0 || !collisionRect) return undefined;
  event.preventDefault();

  const zones = droppableContainers
    .getEnabled()
    .flatMap((container) => {
      const rect = droppableRects.get(container.id);
      return rect ? [rect] : [];
    })
    .sort((a, b) => a.top - b.top);
  if (zones.length === 0) return undefined;

  // Dónde está ahora la carta; si no está sobre ninguna zona (acaba de salir de la suya),
  // se entra por el principio o por el final según hacia dónde se vaya.
  const centerY = collisionRect.top + collisionRect.height / 2;
  const current = zones.findIndex(
    (zone) => centerY >= zone.top && centerY <= zone.top + zone.height,
  );
  const from = current === -1 ? (step > 0 ? -1 : zones.length) : current;
  const target = zones[(from + step + zones.length) % zones.length];
  if (!target) return undefined;

  // Un poco dentro de la zona, para que quede claramente sobre ella y no en su borde.
  return { x: target.left + 8, y: target.top + 8 };
};
