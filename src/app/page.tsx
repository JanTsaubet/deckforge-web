import { Layers, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { buttonStyles } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

const highlights = [
  {
    icon: Layers,
    title: "Editor ágil",
    description:
      "Añade cartas con el teclado, arrastra entre zonas y ve las estadísticas al instante.",
  },
  {
    icon: Search,
    title: "Búsqueda potente",
    description: "Sintaxis completa de Scryfall con filtros visuales y resultados inmediatos.",
  },
  {
    icon: Sparkles,
    title: "Recomendaciones",
    description: "Sinergias, combos detectados y alternativas según tu presupuesto.",
  },
] as const;

/** Landing pública. */
export default function HomePage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-20 sm:px-6">
        <section className="flex flex-col items-center gap-6 text-center">
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
            Fase 0 · Esqueleto del proyecto
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Forja mazos de <span className="text-accent">Magic</span> sin fricción
          </h1>
          <p className="max-w-xl text-pretty text-muted">{siteConfig.description}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={routes.decks} className={buttonStyles({ size: "lg" })}>
              Ir a mis mazos
            </Link>
            <Link
              href={routes.search}
              className={buttonStyles({ variant: "secondary", size: "lg" })}
            >
              Buscar cartas
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-surface p-6 transition-colors duration-300 ease-smooth hover:border-accent/50"
            >
              <Icon className="mb-4 size-6 text-accent" aria-hidden />
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted">{description}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
