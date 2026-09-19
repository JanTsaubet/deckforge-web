import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast, TOAST_DURATION_MS, useToastStore } from "./toast";

describe("toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra el aviso con su tono", () => {
    toast.success("Mazo borrado");
    toast.error("No se ha podido copiar");

    expect(useToastStore.getState().toasts.map(({ tone, message }) => ({ tone, message }))).toEqual(
      [
        { tone: "success", message: "Mazo borrado" },
        { tone: "error", message: "No se ha podido copiar" },
      ],
    );
  });

  it("desaparece solo al cabo de un rato", () => {
    toast.success("Mazo borrado");

    vi.advanceTimersByTime(TOAST_DURATION_MS);

    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("se puede cerrar antes de tiempo sin afectar a los demás", () => {
    toast.success("Primero");
    toast.success("Segundo");
    const [first] = useToastStore.getState().toasts;

    useToastStore.getState().dismiss(first!.id);

    expect(useToastStore.getState().toasts.map((item) => item.message)).toEqual(["Segundo"]);
  });
});
