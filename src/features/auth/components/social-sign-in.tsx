"use client";

import type { Route } from "next";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-field";
import { routes } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";
import { describeAuthError } from "../lib/auth-errors";
import { safeRedirectPath } from "../lib/safe-redirect";
import { SOCIAL_PROVIDER_LABELS, type SocialProvider } from "../lib/social-providers";

interface SocialSignInProps {
  providers: SocialProvider[];
  /** Ruta a la que volver al terminar (el `?next=` del acceso). */
  next?: string;
  /** Página a la que volver si algo falla, para enseñar el error. */
  errorPath: Route;
}

/** Logotipos oficiales, simplificados a un solo trazado y en los colores de cada marca. */
function ProviderIcon({ provider }: { provider: SocialProvider }) {
  if (provider === "google") {
    return (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"
        />
        <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
        <path
          fill="#EA4335"
          d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#5865F2"
        d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.4C.6 9 0 13.6.3 18.1a19.9 19.9 0 0 0 6 3l1.3-2a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12 0l.5.4c-.6.4-1.3.7-2 1l1.3 2a19.8 19.8 0 0 0 6-3c.5-5.2-.8-9.7-3.6-13.7ZM8.5 15.4c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm7 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"
      />
    </svg>
  );
}

/**
 * Botones de acceso con Google y Discord. Solo aparecen los que la API tiene configurados.
 *
 * Al pulsar, Better Auth pide a la API la URL del proveedor y el navegador se va allí; al
 * volver, la sesión ya está creada y se llega a `next`. Si algo falla, se vuelve a
 * `errorPath` con `?error=`, que la página traduce a un mensaje.
 */
export function SocialSignIn({ providers, next, errorPath }: SocialSignInProps) {
  const [pending, setPending] = useState<SocialProvider>();
  const [error, setError] = useState<string>();

  if (providers.length === 0) return null;

  async function signIn(provider: SocialProvider) {
    setPending(provider);
    setError(undefined);
    const { error: authError } = await authClient.signIn.social({
      provider,
      callbackURL: safeRedirectPath(next, routes.decks),
      errorCallbackURL: errorPath,
    });
    // Si todo va bien, el navegador ya se está yendo al proveedor: no se toca nada más.
    if (authError) {
      setError(describeAuthError(authError));
      setPending(undefined);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {providers.map((provider) => (
        <Button
          key={provider}
          type="button"
          variant="secondary"
          onClick={() => void signIn(provider)}
          disabled={pending !== undefined}
        >
          <ProviderIcon provider={provider} />
          {pending === provider
            ? `Conectando con ${SOCIAL_PROVIDER_LABELS[provider]}…`
            : `Continuar con ${SOCIAL_PROVIDER_LABELS[provider]}`}
        </Button>
      ))}
      {error && <FormError>{error}</FormError>}
      <div className="flex items-center gap-3 text-xs text-muted" aria-hidden>
        <span className="h-px flex-1 bg-border" />o con tu email
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
