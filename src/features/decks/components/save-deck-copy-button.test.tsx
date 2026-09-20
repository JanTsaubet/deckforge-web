import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useToastStore } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/auth-client";
import { duplicateDeckAction } from "../actions/deck-actions";
import { SaveDeckCopyButton } from "./save-deck-copy-button";

vi.mock("@/lib/auth/auth-client", () => ({ authClient: { useSession: vi.fn() } }));
vi.mock("../actions/deck-actions", () => ({ duplicateDeckAction: vi.fn() }));

const useSession = vi.mocked(authClient.useSession);
const duplicate = vi.mocked(duplicateDeckAction);

/** `useSession` devuelve muchos más campos; al componente solo le importan estos dos. */
const session = (data: unknown, isPending = false) =>
  useSession.mockReturnValue({ data, isPending } as never);

const messages = () => useToastStore.getState().toasts.map((toast) => toast.message);

describe("SaveDeckCopyButton", () => {
  beforeEach(() => {
    duplicate.mockReset();
    useToastStore.setState({ toasts: [] });
  });

  it("sin sesión lleva al acceso y vuelve al mazo", () => {
    session(null);
    render(<SaveDeckCopyButton deckId="mazo-1" />);

    expect(screen.getByRole("link", { name: "Guardar una copia" })).toHaveAttribute(
      "href",
      "/login?next=%2Fdecks%2Fmazo-1",
    );
  });

  it("con sesión copia el mazo y lo dice", async () => {
    const user = userEvent.setup();
    session({ user: { id: "yo" } });
    duplicate.mockResolvedValue({ ok: true, copyName: "Copia de Krenko" });
    render(<SaveDeckCopyButton deckId="mazo-1" />);

    await user.click(screen.getByRole("button", { name: "Guardar una copia" }));

    expect(duplicate).toHaveBeenCalledWith("mazo-1");
    expect(messages()).toEqual(["«Copia de Krenko» ya está en tu biblioteca."]);
  });

  it("si la API falla, enseña su explicación", async () => {
    const user = userEvent.setup();
    session({ user: { id: "yo" } });
    duplicate.mockResolvedValue({ ok: false, error: "Ese mazo ya no existe." });
    render(<SaveDeckCopyButton deckId="mazo-1" />);

    await user.click(screen.getByRole("button", { name: "Guardar una copia" }));

    expect(messages()).toEqual(["Ese mazo ya no existe."]);
  });

  it("mientras se resuelve la sesión no ofrece nada que pulsar", () => {
    session(null, true);
    render(<SaveDeckCopyButton deckId="mazo-1" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
