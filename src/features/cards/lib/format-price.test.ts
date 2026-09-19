import { describe, expect, it } from "vitest";
import { formatPrice } from "./format-price";

describe("formatPrice", () => {
  it("usa coma decimal, como se escribe en español", () => {
    expect(formatPrice("9.90", "EUR")).toContain("9,90");
    expect(formatPrice("9.90", "EUR")).toContain("€");
  });

  it("distingue dólares de euros", () => {
    expect(formatPrice("0.35", "USD")).toContain("0,35");
    expect(formatPrice("0.35", "USD")).toContain("US$");
  });

  it("sin precio no inventa nada", () => {
    expect(formatPrice(undefined, "EUR")).toBeUndefined();
    expect(formatPrice("", "EUR")).toBeUndefined();
    expect(formatPrice("no-es-un-numero", "EUR")).toBeUndefined();
  });
});
