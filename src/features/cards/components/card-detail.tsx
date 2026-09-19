import type { ReactNode } from "react";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";
import { RARITY_LABELS } from "../constants/card-labels";
import { formatPrice } from "../lib/format-price";
import type { Card, CardFace } from "../types/card";
import { CardLegalities } from "./card-legalities";
import { FlippableCardImage } from "./flippable-card-image";
import { ManaCost } from "./mana-cost";
import { OracleText } from "./oracle-text";

interface CardDetailProps {
  card: Card;
  /** Secciones que llegan en streaming: la página las envuelve en <Suspense>. */
  rulings: ReactNode;
  printings: ReactNode;
}

/** Ficha completa de una carta: imagen, texto, datos de impresión, legalidad y más. */
export function CardDetail({ card, rulings, printings }: CardDetailProps) {
  const hasSeveralFaces = card.faces.length > 1;

  return (
    <article className="grid gap-8 md:grid-cols-[320px_1fr]">
      {/* La imagen acompaña al hacer scroll en pantallas grandes. */}
      <div className="md:sticky md:top-20 md:self-start">
        <FlippableCardImage card={card} className="shadow-2xl shadow-black/40" />
      </div>

      <div className="flex flex-col gap-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{card.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            {card.manaCost && <ManaCost cost={card.manaCost} />}
            <span>{card.typeLine}</span>
          </div>
        </header>

        {hasSeveralFaces
          ? card.faces.map((face) => <FaceText key={face.name} face={face} />)
          : card.oracleText && (
              <section className="rounded-xl border border-border bg-surface p-5">
                <OracleText text={card.oracleText} />
              </section>
            )}

        <dl className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="Edición">
            {card.set.name} ({card.set.code.toUpperCase()}) · nº {card.collectorNumber}
          </DetailItem>
          <DetailItem label="Rareza">{RARITY_LABELS[card.rarity] ?? card.rarity}</DetailItem>
          <DetailItem label="Valor de maná">{card.manaValue}</DetailItem>
          <DetailItem label="Precio">{formatPrices(card.prices)}</DetailItem>
        </dl>

        <Section title="Legalidad por formato">
          <CardLegalities legalities={card.legalities} />
        </Section>

        <Section title="Aclaraciones">{rulings}</Section>

        <Section title="Impresiones">{printings}</Section>

        <PlaceholderPanel
          title="Mazos de la comunidad que la usan"
          phase="Fase 5"
          description="Cuántos mazos públicos la incluyen y con qué comandantes aparece más."
        />
      </div>
    </article>
  );
}

/** Texto de una de las caras en las cartas de varias caras. */
function FaceText({ face }: { face: CardFace }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <header className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="font-semibold">{face.name}</h2>
        {face.manaCost && <ManaCost cost={face.manaCost} />}
        {face.typeLine && <span className="text-xs text-muted">{face.typeLine}</span>}
      </header>
      {face.oracleText && <OracleText text={face.oracleText} />}
    </section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
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

function formatPrices({ usd, eur }: Card["prices"]): string {
  const parts = [formatPrice(eur, "EUR"), formatPrice(usd, "USD")].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Sin datos de precio";
}
