"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { routes } from "@/config/routes";
import type { Card } from "../types/card";
import { CardImage } from "./card-image";

/** Nº de cartas que conservan retardo escalonado; a partir de ahí entran a la vez. */
const MAX_STAGGERED_ITEMS = 12;

interface CardGridProps {
  cards: Card[];
}

/** Rejilla de resultados. Las cartas aparecen escalonadas y se elevan al pasar el ratón. */
export function CardGrid({ cards }: CardGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map((card, index) => (
        <motion.li
          key={card.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
            delay: Math.min(index, MAX_STAGGERED_ITEMS) * 0.02,
          }}
        >
          <Link
            href={routes.card(card.id)}
            title={card.name}
            className="block rounded-xl transition-transform duration-300 ease-smooth hover:-translate-y-1"
          >
            <CardImage card={card} priority={index < 5} />
            <span className="sr-only">{card.name}</span>
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}
