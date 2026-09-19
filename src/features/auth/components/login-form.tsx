"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormError, TextField } from "@/components/ui/form-field";
import { authClient } from "@/lib/auth/auth-client";
import { describeAuthError } from "../lib/auth-errors";
import { safeRedirectPath } from "../lib/safe-redirect";

interface LoginFormProps {
  /** Ruta a la que volver tras entrar (llega en `?next=`); se valida antes de usarla. */
  next?: string;
}

/** Acceso con email o nombre de usuario, a elección de quien entra. */
export function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const identifier = String(form.get("identifier") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setError(undefined);

    startTransition(async () => {
      const { error: authError } = identifier.includes("@")
        ? await authClient.signIn.email({ email: identifier, password })
        : await authClient.signIn.username({ username: identifier, password });

      if (authError) {
        setError(describeAuthError(authError));
        return;
      }

      router.push(safeRedirectPath(next));
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6"
    >
      <TextField
        label="Email o nombre de usuario"
        name="identifier"
        autoComplete="username"
        required
        autoFocus
      />
      <TextField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {error && <FormError>{error}</FormError>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
