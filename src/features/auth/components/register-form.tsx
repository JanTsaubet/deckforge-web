"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormError, TextField } from "@/components/ui/form-field";
import { routes } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";
import { describeAuthError } from "../lib/auth-errors";

/** Registro con email y contraseña más un nombre de usuario público. */
export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const read = (field: string) => String(form.get(field) ?? "").trim();
    setError(undefined);

    startTransition(async () => {
      const { error: authError } = await authClient.signUp.email({
        name: read("name"),
        username: read("username"),
        email: read("email"),
        // La contraseña no se recorta: un espacio al final también cuenta.
        password: String(form.get("password") ?? ""),
      });

      if (authError) {
        setError(describeAuthError(authError));
        return;
      }

      router.push(routes.decks);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6"
    >
      <TextField label="Nombre" name="name" autoComplete="name" required autoFocus />
      <TextField
        label="Nombre de usuario"
        name="username"
        autoComplete="username"
        required
        minLength={3}
        maxLength={30}
        pattern="[A-Za-z0-9_.]+"
        hint="Letras, números, puntos y guiones bajos. Será tu dirección pública: /u/usuario"
      />
      <TextField label="Email" name="email" type="email" autoComplete="email" required />
      <TextField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="Al menos 8 caracteres."
      />
      {error && <FormError>{error}</FormError>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
