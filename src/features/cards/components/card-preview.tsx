"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import type { CatalogCard } from "@/features/decks/types/deck";
import { cn } from "@/lib/utils/cn";

interface CardPreviewProps {
  /** Carta que se está señalando; sin ella se muestra la pista. */
  card?: CatalogCard;
  /** Qué hacer para que aparezca una carta. */
  hint?: string;
  className?: string;
}

/**
 * Hueco fijo con la carta que se está señalando en una lista. Mantiene siempre la proporción
 * de una carta (488×680) para que el panel no dé saltos, y cruza una imagen con la siguiente.
 */
export function CardPreview({
  card,
  hint = "Pasa el ratón por una carta para verla.",
  className,
}: CardPreviewProps) {
  return (
    <div
      className={cn(
        "relative aspect-[488/680] overflow-hidden rounded-xl bg-surface-raised",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {card?.imageNormal ? (
          <motion.div
            key={card.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0"
          >
            {/* `unoptimized`: las imágenes de Scryfall ya vienen optimizadas desde su CDN. */}
            <Image
              src={card.imageNormal}
              alt={card.name}
              fill
              unoptimized
              sizes="320px"
              className="object-cover"
            />
          </motion.div>
        ) : (
          <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted">
            {hint}
          </p>
        )}
      </AnimatePresence>
    </div>
  );
}
