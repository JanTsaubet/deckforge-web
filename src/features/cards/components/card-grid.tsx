"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { routes } from "@/config/routes";
import { columnsForWidth, GRID_GAP, rowHeightForWidth } from "../lib/card-grid-layout";
import type { Card } from "../types/card";
import { CardImage } from "./card-image";

interface CardGridProps {
  cards: Card[];
}

interface Measurements {
  width: number;
  /** Distancia hasta el inicio del documento; la necesita el virtualizador de ventana. */
  offsetTop: number;
  /** Alto del viewport: sin él no se puede saber qué filas están visibles. */
  viewportHeight: number;
}

/**
 * Rejilla de resultados virtualizada: solo monta las filas visibles y un pequeño margen.
 *
 * Con varias páginas cargadas hay cientos de cartas, y montarlas todas multiplica los nodos
 * del DOM y el trabajo del navegador en cada scroll. A cambio se pierde la animación
 * escalonada de entrada: al montarse y desmontarse las filas al pasar, se repetiría sin parar.
 *
 * Si no se puede medir (ancho o viewport a cero), se pinta la rejilla completa: es preferible
 * montar de más que dejar al usuario mirando un hueco vacío.
 */
export function CardGrid({ cards }: CardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [{ width, offsetTop, viewportHeight }, setMeasurements] = useState<Measurements>({
    width: 0,
    offsetTop: 0,
    viewportHeight: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Sistemas externos: medir aquí evita leer el layout durante el render.
    const measure = () =>
      setMeasurements({
        width: container.clientWidth,
        offsetTop: container.offsetTop,
        viewportHeight: window.innerHeight,
      });

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const columns = columnsForWidth(width);
  const rowHeight = width > 0 ? rowHeightForWidth(width, columns) : 0;
  const canVirtualize = width > 0 && viewportHeight > 0;

  const virtualizer = useWindowVirtualizer({
    count: Math.ceil(cards.length / columns),
    estimateSize: () => rowHeight,
    overscan: 2,
    scrollMargin: offsetTop,
  });

  // Al cambiar el ancho cambia el alto de fila, y las medidas cacheadas dejan de valer.
  useEffect(() => virtualizer.measure(), [virtualizer, rowHeight]);

  if (!canVirtualize) {
    return (
      <div
        ref={containerRef}
        role="list"
        className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {cards.map((card, index) => (
          <div key={card.id} role="listitem">
            <CardGridItem card={card} priority={index < 5} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="list"
      className="relative w-full"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((row) => {
        const firstIndex = row.index * columns;
        const rowCards = cards.slice(firstIndex, firstIndex + columns);

        return (
          <div
            key={row.key}
            // La fila es solo maquetación: las cartas siguen siendo los elementos de la lista.
            role="presentation"
            className="absolute top-0 left-0 grid w-full"
            style={{
              gap: GRID_GAP,
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
            }}
          >
            {rowCards.map((card, index) => (
              <div key={card.id} role="listitem">
                <CardGridItem card={card} priority={row.index === 0 && index < columns} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function CardGridItem({ card, priority }: { card: Card; priority: boolean }) {
  return (
    <Link
      href={routes.card(card.id)}
      title={card.name}
      className="block rounded-xl transition-transform duration-300 ease-smooth hover:-translate-y-1"
    >
      <CardImage card={card} priority={priority} />
      <span className="sr-only">{card.name}</span>
    </Link>
  );
}
