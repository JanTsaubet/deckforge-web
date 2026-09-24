import type { Active, ClientRect, DroppableContainer } from "@dnd-kit/core";
import { describe, expect, it, vi } from "vitest";
import { catalogCard } from "@/test/fixtures/catalog-card";
import {
  acceptsCard,
  dragCard,
  zoneCollisionDetection,
  zoneCoordinateGetter,
  type DragCard,
} from "./drag-and-drop";

const krenko = catalogCard({
  id: "krenko",
  name: "Krenko, Mob Boss",
  typeLine: "Legendary Creature — Goblin Warrior",
});
const bolt = catalogCard({ id: "bolt", name: "Lightning Bolt", typeLine: "Instant" });

/** Lo que dnd-kit entrega en `onDragEnd`, con `data` ya resuelto. */
const active = (data: unknown): Active =>
  ({ id: "x", data: { current: data }, rect: { current: {} } }) as Active;

const dragging = (card = bolt, board: DragCard["board"] = "main"): DragCard => ({
  card,
  board,
  quantity: 1,
});

const commanderDeck = { hasCommander: true, commanderCount: 0 };

describe("dragCard", () => {
  it("devuelve la carta que se arrastra", () => {
    expect(dragCard(active(dragging()))).toMatchObject({ board: "main" });
  });

  it("no se fía de lo que venga en `data`", () => {
    expect(dragCard(null)).toBeUndefined();
    expect(dragCard(active(undefined))).toBeUndefined();
    expect(dragCard(active("una cadena"))).toBeUndefined();
    expect(dragCard(active({ otraCosa: 1 }))).toBeUndefined();
  });
});

describe("acceptsCard", () => {
  it("sin arrastre, ninguna zona acepta nada", () => {
    expect(acceptsCard("main", undefined, commanderDeck)).toBe(false);
  });

  it("la zona de la que sale no la acepta: soltarla ahí no haría nada", () => {
    expect(acceptsCard("main", dragging(), commanderDeck)).toBe(false);
    expect(acceptsCard("sideboard", dragging(), commanderDeck)).toBe(true);
  });

  it("al hueco de comandante solo entra lo que puede serlo", () => {
    expect(acceptsCard("commander", dragging(bolt), commanderDeck)).toBe(false);
    expect(acceptsCard("commander", dragging(krenko), commanderDeck)).toBe(true);
  });

  it("con dos comandantes ya elegidos, el hueco está lleno", () => {
    const full = { hasCommander: true, commanderCount: 2 };
    expect(acceptsCard("commander", dragging(krenko), full)).toBe(false);
  });

  it("en un formato sin comandante, esa zona no acepta nada", () => {
    const modern = { hasCommander: false, commanderCount: 0 };
    expect(acceptsCard("commander", dragging(krenko), modern)).toBe(false);
    expect(acceptsCard("sideboard", dragging(krenko), modern)).toBe(true);
  });
});

/** Tres zonas, una debajo de otra, como en la pantalla. */
const rect = (top: number): ClientRect =>
  ({ top, left: 100, width: 600, height: 100, right: 700, bottom: top + 100 }) as ClientRect;

const ZONES = [
  ["commander", rect(0)],
  ["main", rect(100)],
  ["sideboard", rect(200)],
] as const;

/** El contexto que dnd-kit pasa al teclado, con lo poco que mira el buscador de coordenadas. */
function keyboardContext(cardTop: number) {
  return {
    context: {
      collisionRect: rect(cardTop),
      droppableRects: new Map(ZONES.map(([id, zone]) => [id, zone])),
      droppableContainers: { getEnabled: () => ZONES.map(([id, zone]) => ({ id, rect: zone })) },
    },
  };
}

const arrow = (code: string) =>
  ({ code, preventDefault: vi.fn() }) as unknown as KeyboardEvent & { preventDefault: () => void };

/** El contexto de prueba solo trae los campos que mira la función, no media librería. */
type ContextoDeTeclado = Parameters<typeof zoneCoordinateGetter>[1];

const press = (code: string, cardTop: number) =>
  zoneCoordinateGetter(arrow(code), keyboardContext(cardTop) as unknown as ContextoDeTeclado);

describe("zoneCoordinateGetter", () => {
  it("cada flecha abajo lleva la carta a la zona siguiente", () => {
    // La carta está sobre la primera zona: abajo la lleva a la segunda.
    expect(press("ArrowDown", 0)).toEqual({ x: 108, y: 108 });
    expect(press("ArrowDown", 100)).toEqual({ x: 108, y: 208 });
  });

  it("al llegar al final da la vuelta", () => {
    expect(press("ArrowDown", 200)).toEqual({ x: 108, y: 8 });
    expect(press("ArrowUp", 0)).toEqual({ x: 108, y: 208 });
  });

  it("las flechas laterales hacen lo mismo que arriba y abajo", () => {
    expect(press("ArrowRight", 0)).toEqual(press("ArrowDown", 0));
    expect(press("ArrowLeft", 100)).toEqual(press("ArrowUp", 100));
  });

  it("las demás teclas no mueven nada (y dejan que sigan su camino)", () => {
    const event = arrow("Space");
    expect(
      zoneCoordinateGetter(event, keyboardContext(0) as unknown as ContextoDeTeclado),
    ).toBeUndefined();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});

type CollisionArgs = Parameters<typeof zoneCollisionDetection>[0];

/**
 * Lo que dnd-kit pasa a la detección de colisiones. Solo entran las zonas **habilitadas**:
 * una zona que no admite la carta que se arrastra ni siquiera llega hasta aquí.
 */
function collisionArgs(
  enabled: ReadonlyArray<readonly [string, ClientRect]>,
  { pointerY, cardTop = 0 }: { pointerY?: number; cardTop?: number },
): CollisionArgs {
  return {
    active: active(dragging()),
    collisionRect: rect(cardTop),
    droppableRects: new Map(enabled.map(([id, zone]) => [id, zone])),
    droppableContainers: enabled.map(
      ([id, zone]) => ({ id, rect: { current: zone } }) as DroppableContainer,
    ),
    pointerCoordinates: pointerY === undefined ? null : { x: 400, y: pointerY },
  };
}

describe("zoneCollisionDetection", () => {
  it("con el ratón, la carta cae en la zona que hay bajo el puntero", () => {
    const collisions = zoneCollisionDetection(collisionArgs(ZONES, { pointerY: 150 }));

    expect(collisions.map((collision) => collision.id)).toEqual(["main"]);
  });

  it("soltarla sobre una zona que no la admite no la lleva a ninguna otra", () => {
    // El hueco de comandante no admite esta carta, así que no está entre las habilitadas, y el
    // puntero está sobre él. Antes caía en la más cercana y la carta acababa en el banquillo.
    const enabled = ZONES.filter(([id]) => id !== "commander");

    const collisions = zoneCollisionDetection(collisionArgs(enabled, { pointerY: 50 }));

    expect(collisions).toEqual([]);
  });

  it("con el teclado, que no tiene puntero, cae en la zona más cercana a la carta", () => {
    const collisions = zoneCollisionDetection(collisionArgs(ZONES, { cardTop: 210 }));

    expect(collisions[0]?.id).toBe("sideboard");
  });
});
