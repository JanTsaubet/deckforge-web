"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { Card } from "../types/card";

interface CardImageProps {
  card: Card;
  /** `normal` en rejillas, `large` en la página de detalle. */
  size?: "small" | "normal" | "large";
  /** Solo para las primeras cartas visibles: evita retrasar el LCP. */
  priority?: boolean;
  className?: string;
}

/**
 * Imagen de carta con su proporción real (5:7) y aparición suave al terminar de cargar,
 * para que la rejilla no "parpadee" mientras llegan las imágenes.
 */
export function CardImage({ card, size = "normal", priority = false, className }: CardImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const source = card.images?.[size];

  // Algunas cartas (sobre todo de doble cara antiguas) no traen imagen directa.
  if (!source) {
    return (
      <div
        className={cn(
          "grid aspect-[5/7] place-items-center rounded-xl border border-border bg-surface p-3 text-center text-xs text-muted",
          className,
        )}
      >
        {card.name}
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-[5/7] overflow-hidden rounded-xl bg-surface", className)}>
      <Image
        src={source}
        alt={card.name}
        fill
        // Las imágenes de Scryfall ya llegan optimizadas desde su CDN.
        unoptimized
        priority={priority}
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "object-cover transition-opacity duration-500 ease-smooth",
          isLoaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
