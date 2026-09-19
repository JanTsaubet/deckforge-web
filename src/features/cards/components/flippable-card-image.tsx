"use client";

import { RotateCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { Card } from "../types/card";
import { CardImage } from "./card-image";

interface FlippableCardImageProps {
  card: Card;
  className?: string;
}

/**
 * Imagen de la carta que, si tiene dos caras físicas, se gira en 3D para ver la trasera.
 * Con "reducir movimiento" activado el giro es instantáneo (lo anula globals.css).
 */
export function FlippableCardImage({ card, className }: FlippableCardImageProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const front = card.faces[0];
  const back = card.faces[1];

  if (!back?.images) {
    return <CardImage card={card} size="large" priority className={className} />;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full perspective-distant">
        <div
          className={cn(
            "relative transition-transform duration-700 ease-smooth transform-3d",
            isFlipped && "rotate-y-180",
          )}
        >
          <div className="backface-hidden" aria-hidden={isFlipped}>
            <CardImage card={card} size="large" priority className={className} />
          </div>
          <div className="absolute inset-0 rotate-y-180 backface-hidden" aria-hidden={!isFlipped}>
            <CardImage
              card={{ ...card, name: back.name, images: back.images }}
              size="large"
              className={className}
            />
          </div>
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        aria-pressed={isFlipped}
        onClick={() => setIsFlipped((flipped) => !flipped)}
      >
        <RotateCw
          className={cn(
            "size-4 transition-transform duration-500 ease-smooth",
            isFlipped && "rotate-180",
          )}
          aria-hidden
        />
        Ver {isFlipped ? (front?.name ?? "cara frontal") : back.name}
      </Button>
    </div>
  );
}
