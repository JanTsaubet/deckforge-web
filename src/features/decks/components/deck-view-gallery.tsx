import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import type { CatalogCard, DeckCardLine } from "../types/deck";

interface DeckViewGalleryProps {
  lines: DeckCardLine[];
  /** La primera zona de la pantalla carga sus imágenes de inmediato; el resto, al llegar. */
  priority?: boolean;
}

/** Las cartas de una zona en imágenes: el mazo se lee de un vistazo. */
export function DeckViewGallery({ lines, priority = false }: DeckViewGalleryProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {lines.map(({ card, quantity }, index) => (
        <li key={card.id} className="relative">
          <Link
            href={routes.card(card.id)}
            title={card.name}
            className="block overflow-hidden rounded-xl transition-transform duration-300 ease-smooth outline-none hover:-translate-y-1 focus-visible:-translate-y-1"
          >
            <GalleryImage card={card} priority={priority && index < 6} />
          </Link>
          {quantity > 1 && (
            <span
              aria-label={`${quantity} copias`}
              className="pointer-events-none absolute top-1.5 right-1.5 rounded-md bg-background/85 px-1.5 py-0.5 text-xs font-medium tabular-nums backdrop-blur"
            >
              ×{quantity}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function GalleryImage({ card, priority }: { card: CatalogCard; priority: boolean }) {
  // Algunas cartas (sobre todo de doble cara antiguas) no traen imagen en el catálogo.
  if (!card.imageNormal) {
    return (
      <span className="grid aspect-[488/680] place-items-center bg-surface-raised p-3 text-center text-xs text-muted">
        {card.name}
      </span>
    );
  }

  return (
    <span className="relative block aspect-[488/680] bg-surface-raised">
      {/* `unoptimized`: las imágenes de Scryfall ya vienen optimizadas desde su CDN. */}
      <Image
        src={card.imageNormal}
        alt={card.name}
        fill
        unoptimized
        priority={priority}
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
        className="object-cover"
      />
    </span>
  );
}
