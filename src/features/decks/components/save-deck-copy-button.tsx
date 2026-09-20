"use client";

import { Copy } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useTransition } from "react";
import { buttonStyles } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { routes } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";
import { duplicateDeckAction } from "../actions/deck-actions";

interface SaveDeckCopyButtonProps {
  deckId: string;
}

const LABEL = "Guardar una copia";

/**
 * Copia el mazo a tu biblioteca, que es la forma de partir de un mazo ajeno para hacerlo tuyo.
 * Sin sesión no hay dónde guardarlo: el botón lleva al acceso y vuelve a este mazo.
 */
export function SaveDeckCopyButton({ deckId }: SaveDeckCopyButtonProps) {
  const { data: session, isPending } = authClient.useSession();
  const [isSaving, startSaving] = useTransition();

  // Mismo hueco que el botón: la cabecera no salta al resolverse la sesión.
  if (isPending) return <Skeleton className="h-10 w-44" />;

  if (!session) {
    return (
      <Link
        href={`${routes.login}?next=${encodeURIComponent(routes.deck(deckId))}` as Route}
        className={buttonStyles({ variant: "secondary" })}
      >
        <Copy className="size-4" aria-hidden />
        {LABEL}
      </Link>
    );
  }

  function save() {
    startSaving(async () => {
      const result = await duplicateDeckAction(deckId);
      if (result.ok) toast.success(`«${result.copyName}» ya está en tu biblioteca.`);
      else toast.error(result.error ?? "No se ha podido copiar el mazo.");
    });
  }

  return (
    <button
      type="button"
      onClick={save}
      disabled={isSaving}
      className={buttonStyles({ variant: "secondary" })}
    >
      <Copy className="size-4" aria-hidden />
      {isSaving ? "Guardando…" : LABEL}
    </button>
  );
}
