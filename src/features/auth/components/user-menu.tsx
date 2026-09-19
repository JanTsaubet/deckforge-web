"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buttonStyles } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";

/** Zona de la cabecera que cambia según haya sesión o no. */
export function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, startTransition] = useTransition();

  // Mismo hueco que ocupan los botones: la cabecera no salta al resolverse la sesión.
  if (isPending) return <Skeleton className="h-8 w-40" />;

  if (!session) {
    return (
      <>
        <Link href={routes.login} className={buttonStyles({ variant: "ghost", size: "sm" })}>
          Entrar
        </Link>
        <Link href={routes.register} className={buttonStyles({ size: "sm" })}>
          Crear cuenta
        </Link>
      </>
    );
  }

  const { user } = session;
  const handle = user.displayUsername ?? user.username ?? user.name;

  function signOut() {
    startTransition(async () => {
      await authClient.signOut();
      router.push(routes.home);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      {user.username ? (
        <Link
          href={routes.profile(user.username)}
          className={buttonStyles({ variant: "ghost", size: "sm" })}
        >
          @{handle}
        </Link>
      ) : (
        <span className="px-3 text-sm text-muted">{handle}</span>
      )}
      <button
        type="button"
        onClick={signOut}
        disabled={isSigningOut}
        className={buttonStyles({ variant: "ghost", size: "sm" })}
      >
        <LogOut className="size-4" aria-hidden />
        Salir
      </button>
    </div>
  );
}
