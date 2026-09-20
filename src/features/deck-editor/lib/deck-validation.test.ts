import { describe, expect, it } from "vitest";
import type { CatalogCard } from "@/features/decks/types/deck";
import { catalogCard } from "@/test/fixtures/catalog-card";
import { validateDeck, type DeckIssue } from "./deck-validation";
import type { EditorEntry } from "./editor-entries";

const krenko = catalogCard({
  id: "krenko",
  name: "Krenko, Mob Boss",
  typeLine: "Legendary Creature — Goblin Warrior",
  colorIdentity: ["R"],
});
const mountain = catalogCard({
  id: "mountain",
  name: "Mountain",
  typeLine: "Basic Land — Mountain",
  colorIdentity: [],
});
const bolt = catalogCard({
  id: "bolt",
  name: "Lightning Bolt",
  typeLine: "Instant",
  colorIdentity: ["R"],
});
const elves = catalogCard({ id: "elves", name: "Llanowar Elves", colorIdentity: ["G"] });

const e = (card: CatalogCard, quantity = 1, board: EditorEntry["board"] = "main"): EditorEntry => ({
  card,
  board,
  quantity,
});

/** Un mazo de Commander válido de Krenko: comandante + 99 montañas. */
const legalCommanderDeck = (): EditorEntry[] => [e(krenko, 1, "commander"), e(mountain, 99)];

const messages = (issues: DeckIssue[]) => issues.map((issue) => `${issue.level}: ${issue.message}`);
const levels = (issues: DeckIssue[]) => issues.map((issue) => issue.level);

describe("validateDeck · Commander", () => {
  it("un mazo correcto no tiene problemas", () => {
    expect(validateDeck(legalCommanderDeck(), "commander")).toEqual([]);
  });

  it("le faltan cartas: aviso (se está construyendo); le sobran: error", () => {
    expect(levels(validateDeck([e(krenko, 1, "commander"), e(mountain, 50)], "commander"))).toEqual(
      ["warning"],
    );
    expect(levels(validateDeck([...legalCommanderDeck(), e(bolt)], "commander"))).toEqual([
      "error",
    ]);
  });

  it("sin comandante, pide elegir uno", () => {
    expect(messages(validateDeck([e(mountain, 100)], "commander"))).toEqual([
      "warning: Elige un comandante: fija la identidad de color del mazo.",
    ]);
  });

  it("singleton: solo una copia de cada carta que no sea tierra básica", () => {
    const issues = validateDeck(
      [e(krenko, 1, "commander"), e(bolt, 2), e(mountain, 97)],
      "commander",
    );

    expect(issues).toEqual([
      expect.objectContaining({
        level: "error",
        message: expect.stringContaining("Lightning Bolt"),
        cardIds: ["bolt"],
      }),
    ]);
  });

  it("respeta las cartas que admiten cualquier número de copias", () => {
    const rats = catalogCard({
      id: "rats",
      name: "Relentless Rats",
      colorIdentity: [],
      oracleText: "A deck can have any number of cards named Relentless Rats.",
    });

    expect(
      validateDeck([e(krenko, 1, "commander"), e(rats, 30), e(mountain, 69)], "commander"),
    ).toEqual([]);
  });

  it("detecta las cartas fuera de la identidad de color del comandante", () => {
    const issues = validateDeck(
      [e(krenko, 1, "commander"), e(elves), e(mountain, 98)],
      "commander",
    );

    expect(issues).toEqual([expect.objectContaining({ level: "error", cardIds: ["elves"] })]);
  });

  it("un comandante tiene que ser una criatura legendaria (o decir que puede serlo)", () => {
    const issues = validateDeck([e(bolt, 1, "commander"), e(mountain, 99)], "commander");

    expect(messages(issues)[0]).toMatch(/No puede ser comandante.*Lightning Bolt/);
  });

  it("dos comandantes solo con Partner", () => {
    const tymna = catalogCard({
      id: "tymna",
      name: "Tymna",
      typeLine: "Legendary Creature — Human",
      oracleText: "Partner",
    });
    const kraum = catalogCard({
      id: "kraum",
      name: "Kraum",
      typeLine: "Legendary Creature — Zombie",
      oracleText: "Partner",
    });

    expect(
      validateDeck(
        [e(tymna, 1, "commander"), e(kraum, 1, "commander"), e(mountain, 98)],
        "commander",
      ),
    ).toEqual([]);
    expect(
      levels(
        validateDeck(
          [e(tymna, 1, "commander"), e(krenko, 1, "commander"), e(mountain, 98)],
          "commander",
        ),
      ),
    ).toEqual(["error"]);
  });

  it("señala las prohibidas", () => {
    const channel = catalogCard({
      id: "channel",
      name: "Channel",
      colorIdentity: [],
      legalities: { commander: "banned" },
    });

    const issues = validateDeck(
      [e(krenko, 1, "commander"), e(channel), e(mountain, 98)],
      "commander",
    );

    expect(messages(issues)).toEqual(["error: Prohibidas en Commander: Channel."]);
  });

  it("informa de los Game Changers, sin contarlo como problema", () => {
    const solRing = catalogCard({
      id: "sol",
      name: "Sol Ring",
      colorIdentity: [],
      gameChanger: true,
    });

    const issues = validateDeck(
      [e(krenko, 1, "commander"), e(solRing), e(mountain, 98)],
      "commander",
    );

    expect(levels(issues)).toEqual(["info"]);
  });
});

describe("validateDeck · formatos de 60 cartas", () => {
  const modern = (card: CatalogCard) => ({ ...card, legalities: { modern: "legal" } });

  it("hasta 4 copias, mínimo 60 cartas y banquillo de 15 como mucho", () => {
    const issues = validateDeck(
      [e(modern(bolt), 5), e(modern(mountain), 50), e(modern(elves), 16, "sideboard")],
      "modern",
    );

    expect(levels(issues)).toEqual(["warning", "error", "error"]);
  });

  it("no hay comandante en Modern", () => {
    const issues = validateDeck(
      [e(modern(krenko), 1, "commander"), e(modern(mountain), 60)],
      "modern",
    );

    expect(messages(issues)[0]).toMatch(/no tiene comandante/);
  });

  it("en Vintage las restringidas solo admiten una copia", () => {
    const lotus = catalogCard({
      id: "lotus",
      name: "Black Lotus",
      legalities: { vintage: "restricted" },
    });
    const island = { ...mountain, legalities: { vintage: "legal" } };

    const issues = validateDeck([e(lotus, 2), e(island, 58)], "vintage");

    expect(issues).toEqual([expect.objectContaining({ level: "error", cardIds: ["lotus"] })]);
  });
});
