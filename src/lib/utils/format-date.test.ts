import { describe, expect, it } from "vitest";
import { formatRelativeDate } from "./format-date";

const NOW = new Date("2026-09-19T12:00:00Z");

describe("formatRelativeDate", () => {
  it("usa la unidad más natural", () => {
    expect(formatRelativeDate("2026-09-19T11:55:00Z", NOW)).toBe("hace 5 minutos");
    expect(formatRelativeDate("2026-09-19T09:00:00Z", NOW)).toBe("hace 3 horas");
    expect(formatRelativeDate("2026-09-17T12:00:00Z", NOW)).toBe("anteayer");
    expect(formatRelativeDate("2026-08-29T12:00:00Z", NOW)).toBe("hace 3 semanas");
  });

  it("dice ayer en lugar de hace 1 día", () => {
    expect(formatRelativeDate("2026-09-18T12:00:00Z", NOW)).toBe("ayer");
  });

  it("lo que acaba de pasar es ahora mismo", () => {
    expect(formatRelativeDate("2026-09-19T11:59:40Z", NOW)).toBe("ahora mismo");
  });
});
