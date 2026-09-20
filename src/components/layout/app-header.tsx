import { Layers } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { UserMenu } from "@/features/auth/components/user-menu";
import { cn } from "@/lib/utils/cn";
import { APP_CONTAINER } from "./container";
import { MainNav } from "./main-nav";

/** Cabecera persistente. Server Component: solo la navegación y el menú de usuario son de cliente. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className={cn(APP_CONTAINER, "flex h-14 items-center gap-4 sm:gap-6")}>
        <Link href={routes.home} className="flex items-center gap-2 font-semibold tracking-tight">
          <Layers className="size-5 text-accent" aria-hidden />
          <span className="hidden sm:inline">{siteConfig.name}</span>
        </Link>

        <MainNav />

        <div className="ml-auto flex items-center gap-2">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
