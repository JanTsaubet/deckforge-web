import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useLocalPreference } from "./use-local-preference";

const isSize = (value: unknown): value is "s" | "m" | "l" =>
  value === "s" || value === "m" || value === "l";

interface Widths {
  left: number;
}
const DEFAULT_WIDTHS: Widths = { left: 300 };
const isWidths = (value: unknown): value is Widths =>
  typeof value === "object" && value !== null && typeof (value as Widths).left === "number";

// Cada test con su clave: el hook recuerda lo leído entre renders (y entre tests).
let key = 0;
const nextKey = () => `prueba-${++key}`;

describe("useLocalPreference", () => {
  beforeEach(() => window.localStorage.clear());

  it("sin nada guardado, usa el valor por defecto", () => {
    const { result } = renderHook(() => useLocalPreference(nextKey(), "m", isSize));

    expect(result.current[0]).toBe("m");
  });

  it("guarda lo que se elige y lo recupera en la siguiente visita", () => {
    const storageKey = nextKey();
    const first = renderHook(() => useLocalPreference(storageKey, "m", isSize));

    act(() => first.result.current[1]("l"));

    expect(first.result.current[0]).toBe("l");
    const later = renderHook(() => useLocalPreference(storageKey, "m", isSize));
    expect(later.result.current[0]).toBe("l");
  });

  it("dos sitios que usan la misma preferencia cambian a la vez", () => {
    const storageKey = nextKey();
    const a = renderHook(() => useLocalPreference(storageKey, "m", isSize));
    const b = renderHook(() => useLocalPreference(storageKey, "m", isSize));

    act(() => a.result.current[1]("s"));

    expect(b.result.current[0]).toBe("s");
  });

  it("ignora lo guardado si no es válido (otra versión, o lo ha tocado alguien)", () => {
    const broken = nextKey();
    const wrongShape = nextKey();
    window.localStorage.setItem(broken, "{no es json");
    window.localStorage.setItem(wrongShape, JSON.stringify("xl"));

    expect(renderHook(() => useLocalPreference(broken, "m", isSize)).result.current[0]).toBe("m");
    expect(renderHook(() => useLocalPreference(wrongShape, "m", isSize)).result.current[0]).toBe(
      "m",
    );
  });

  it("con objetos devuelve siempre el mismo mientras no cambie (si no, React entraría en bucle)", () => {
    const storageKey = nextKey();
    window.localStorage.setItem(storageKey, JSON.stringify({ left: 420 }));
    const { result, rerender } = renderHook(() =>
      useLocalPreference(storageKey, DEFAULT_WIDTHS, isWidths),
    );
    const first = result.current[0];

    rerender();

    expect(result.current[0]).toBe(first);
    expect(first).toEqual({ left: 420 });
  });
});
