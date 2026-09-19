import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { libraryHref, type LibraryFilters } from "../lib/library-filters";

interface DeckTagsProps {
  tags: string[];
  filters: LibraryFilters;
  className?: string;
}

/**
 * Etiquetas de un mazo. Cada una es un enlace que filtra la biblioteca por ella, conservando
 * el resto de filtros. La activa se resalta.
 */
export function DeckTags({ tags, filters, className }: DeckTagsProps) {
  if (tags.length === 0) return null;

  return (
    <ul aria-label="Etiquetas" className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((tag) => {
        const isActive = filters.tag === tag;
        return (
          <li key={tag}>
            <Link
              href={libraryHref({ ...filters, tag: isActive ? "" : tag })}
              scroll={false}
              aria-pressed={isActive}
              title={isActive ? "Quitar el filtro" : `Ver los mazos con «${tag}»`}
              className={cn(
                "inline-block rounded-md px-1.5 py-0.5 text-xs transition-colors duration-200",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "bg-accent/10 text-accent hover:bg-accent/20",
              )}
            >
              #{tag}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
