import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth/auth-client";
import { SocialSignIn } from "./social-sign-in";

vi.mock("@/lib/auth/auth-client", () => ({
  authClient: { signIn: { social: vi.fn() } },
}));

const social = vi.mocked(authClient.signIn.social);

describe("SocialSignIn", () => {
  beforeEach(() => {
    social.mockReset();
    social.mockResolvedValue({ data: null, error: null } as never);
  });

  it("sin proveedores configurados no pinta nada", () => {
    const { container } = render(<SocialSignIn providers={[]} errorPath="/login" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("pinta solo los proveedores configurados", () => {
    render(<SocialSignIn providers={["discord"]} errorPath="/login" />);

    expect(screen.getByRole("button", { name: "Continuar con Discord" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Google/ })).not.toBeInTheDocument();
  });

  it("entra con el proveedor y vuelve a la ruta pedida", async () => {
    const user = userEvent.setup();
    render(<SocialSignIn providers={["google"]} next="/decks/import" errorPath="/login" />);

    await user.click(screen.getByRole("button", { name: "Continuar con Google" }));

    expect(social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/decks/import",
      errorCallbackURL: "/login",
    });
  });

  it("no usa un `next` que lleve a otra web (redirección abierta)", async () => {
    const user = userEvent.setup();
    render(
      <SocialSignIn
        providers={["google"]}
        next="https://sitio-malicioso.example"
        errorPath="/login"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Continuar con Google" }));

    expect(social).toHaveBeenCalledWith(expect.objectContaining({ callbackURL: "/decks" }));
  });

  it("si la API rechaza el acceso, lo explica y deja volver a intentarlo", async () => {
    social.mockResolvedValue({ data: null, error: { status: 429 } } as never);
    const user = userEvent.setup();
    render(<SocialSignIn providers={["google"]} errorPath="/login" />);

    await user.click(screen.getByRole("button", { name: "Continuar con Google" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Demasiados intentos/);
    expect(screen.getByRole("button", { name: "Continuar con Google" })).toBeEnabled();
  });
});
