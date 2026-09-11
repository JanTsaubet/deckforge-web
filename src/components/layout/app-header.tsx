import { Layers } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { MainNav } from "./main-nav";

/** Cabecera persistente. Server Component: solo `MainNav` necesita JavaScript en cliente. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
        <Link href={routes.home} className="flex items-center gap-2 font-semibold tracking-tight">
          <Layers className="size-5 text-accent" aria-hidden />
          <span className="hidden sm:inline">{siteConfig.name}</span>
        </Link>

        <MainNav />

        <div className="ml-auto flex items-center gap-2">
          {/* TODO(Fase 2): sustituir por el menú de usuario cuando exista sesión. */}
          <Link href={routes.login} className={buttonStyles({ variant: "ghost", size: "sm" })}>
            Entrar
          </Link>
          <Link href={routes.register} className={buttonStyles({ size: "sm" })}>
            Crear cuenta
          </Link>
        </div>
      </div>
    </header>
  );
}
