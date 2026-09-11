import { Layers } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

/** Layout minimalista para acceso y registro, sin la navegación de la app. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Link href={routes.home} className="flex items-center justify-center gap-2 font-semibold">
          <Layers className="size-5 text-accent" aria-hidden />
          {siteConfig.name}
        </Link>
        {children}
      </div>
    </main>
  );
}
