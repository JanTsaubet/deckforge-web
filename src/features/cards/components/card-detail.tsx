import type { ReactNode } from "react";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";
import { RARITY_LABELS } from "../constants/card-labels";
import type { Card } from "../types/card";
import { CardImage } from "./card-image";
import { CardLegalities } from "./card-legalities";
import { ManaCost } from "./mana-cost";

interface CardDetailProps {
  card: Card;
}

/** Ficha completa de una carta: imagen, texto, datos de impresión y legalidad. */
export function CardDetail({ card }: CardDetailProps) {
  return (
    <article className="grid gap-8 md:grid-cols-[320px_1fr]">
      {/* La imagen acompaña al hacer scroll en pantallas grandes. */}
      <div className="md:sticky md:top-20 md:self-start">
        <CardImage card={card} size="large" priority className="shadow-2xl shadow-black/40" />
      </div>

      <div className="flex flex-col gap-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{card.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            {card.manaCost && <ManaCost cost={card.manaCost} />}
            <span>{card.typeLine}</span>
          </div>
        </header>

        {card.oracleText && (
          <section className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm leading-relaxed whitespace-pre-line">{card.oracleText}</p>
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="Edición">
            {card.set.name} ({card.set.code.toUpperCase()}) · nº {card.collectorNumber}
          </DetailItem>
          <DetailItem label="Rareza">{RARITY_LABELS[card.rarity] ?? card.rarity}</DetailItem>
          <DetailItem label="Valor de maná">{card.manaValue}</DetailItem>
          <DetailItem label="Precio">{formatPrices(card.prices)}</DetailItem>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Legalidad por formato</h2>
          <CardLegalities legalities={card.legalities} />
        </section>

        <PlaceholderPanel
          title="Rulings, otras impresiones y mazos que la usan"
          phase="Fase 1 · 5"
          description="Aclaraciones oficiales, todas las ediciones de la carta con sus precios y los mazos de la comunidad que la incluyen."
        />
      </div>
    </article>
  );
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-surface px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}

/** Scryfall da los precios como texto para no perder decimales. */
function formatPrices({ usd, eur }: Card["prices"]): string {
  const parts = [usd && `${usd} $`, eur && `${eur} €`].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Sin datos de precio";
}
