import type { CardRepository } from "@/features/cards/services/card-repository";
import type { Card, CardIdentifier } from "@/features/cards/types/card";
import type { DeckBoard } from "../types/deck";
import type { DecklistLine } from "./decklist-parser";

/** Lo justo de una carta para enseñarla en la vista previa de la importación. */
export interface ImportedCard {
  id: string;
  name: string;
  typeLine: string;
  manaCost?: string;
  imageUrl?: string;
}

export interface ResolvedDecklistEntry {
  card: ImportedCard;
  board: DeckBoard;
  quantity: number;
}

export interface DecklistResolution {
  entries: ResolvedDecklistEntry[];
  /** Líneas cuya carta no existe (o está mal escrita). */
  notFound: DecklistLine[];
}

/**
 * Resuelve contra el catálogo las líneas de una lista ya interpretada.
 *
 * Primero busca la impresión exacta que indica la línea. Lo que no aparece así se busca otra
 * vez solo por nombre: MTG Arena usa códigos de edición propios (su Dominaria es `DAR`; en
 * Scryfall es `dom`), y perder la impresión es mejor que perder la carta.
 */
export async function resolveDecklist(
  lines: DecklistLine[],
  cards: Pick<CardRepository, "getCollection">,
): Promise<DecklistResolution> {
  const exact = await cards.getCollection(lines.map(exactIdentifier));
  const resolved = lines.map((line, index) => {
    const card = exact[index];
    return card && isSameCard(card, line) ? card : undefined;
  });

  const retry = lines.flatMap((line, index) =>
    !resolved[index] && line.setCode ? [{ line, index }] : [],
  );
  if (retry.length > 0) {
    const byName = await cards.getCollection(retry.map(({ line }) => ({ name: lookupName(line) })));
    retry.forEach(({ index }, position) => {
      resolved[index] = byName[position];
    });
  }

  // La misma carta en la misma zona se junta en una entrada ("20 Mountain" + "10 Mountain").
  const entries = new Map<string, ResolvedDecklistEntry>();
  const notFound: DecklistLine[] = [];
  lines.forEach((line, index) => {
    const card = resolved[index];
    if (!card) {
      notFound.push(line);
      return;
    }
    const key = `${line.board}:${card.id}`;
    const existing = entries.get(key);
    if (existing) existing.quantity += line.quantity;
    else
      entries.set(key, { card: toImportedCard(card), board: line.board, quantity: line.quantity });
  });
  return { entries: [...entries.values()], notFound };
}

function exactIdentifier(line: DecklistLine): CardIdentifier {
  if (line.setCode && line.collectorNumber) {
    return { setCode: line.setCode, collectorNumber: line.collectorNumber };
  }
  return { name: lookupName(line), setCode: line.setCode };
}

/**
 * Nombre con el que se busca. Scryfall no encuentra por nombre completo las cartas partidas
 * ("Fire // Ice"), pero sí por su primera mitad; y lo mismo sirve para las de dos caras.
 */
function lookupName(line: DecklistLine): string {
  return line.name.split(" // ")[0] ?? line.name;
}

/**
 * Edición y número pueden apuntar a otra carta: Arena y Scryfall no siempre numeran igual.
 * Si el nombre no coincide, esa impresión no vale.
 */
function isSameCard(card: Card, line: DecklistLine): boolean {
  const normalize = (name: string) => (name.split(" // ")[0] ?? name).toLowerCase();
  return normalize(card.name) === normalize(line.name);
}

function toImportedCard(card: Card): ImportedCard {
  return {
    id: card.id,
    name: card.name,
    typeLine: card.typeLine,
    manaCost: card.manaCost,
    imageUrl: card.images?.small,
  };
}
