import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "./quick-add";

describe("parseQuickAdd", () => {
  it.each([
    ["4 Lightning Bolt", { quantity: 4, query: "Lightning Bolt" }],
    ["4x bolt", { quantity: 4, query: "bolt" }],
    ["  sol ring ", { quantity: 1, query: "sol ring" }],
    ["0 bolt", { quantity: 1, query: "bolt" }],
    ["500 island", { quantity: 99, query: "island" }],
    ["4", { quantity: 1, query: "4" }],
  ])("%s", (text, expected) => {
    expect(parseQuickAdd(text)).toEqual(expected);
  });
});
