"use client";

import { TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { ManaSymbol } from "@/features/cards/components/mana-symbol";
import { MANA_COLOR_CLASSES, MANA_COLOR_LABELS } from "@/features/cards/constants/mana-colors";
import { cn } from "@/lib/utils/cn";
import { CARD_CATEGORIES, CARD_CATEGORY_LABELS } from "../lib/card-category";
import { CURVE_BUCKETS, type DeckStats } from "../lib/deck-stats";
import { balanceColors } from "../lib/mana-sources";

interface DeckStatsPanelProps {
  stats: DeckStats;
}

const EURO = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

/**
 * Las cifras de un mazo: resumen, curva de maná, reparto de símbolos de color y tipos.
 * Lo comparten el editor (donde cambia en vivo) y la vista pública.
 */
export function DeckStatsPanel({ stats }: DeckStatsPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Resumen" className="grid grid-cols-2 gap-2 text-sm">
        <Stat label="Cartas" value={String(stats.playable)} />
        <Stat
          label="Precio"
          value={EURO.format(stats.priceEur)}
          hint={stats.cardsWithoutPrice > 0 ? `${stats.cardsWithoutPrice} sin precio` : undefined}
        />
        <Stat
          label="Valor medio"
          value={stats.averageManaValue.toFixed(2).replace(".", ",")}
          hint="sin tierras"
        />
        <Stat label="Tierras" value={String(stats.byCategory.land)} />
      </section>

      <ManaCurve curve={stats.curve} />
      <ManaBalance stats={stats} />

      <section aria-label="Tipos">
        <h3 className="mb-2 text-xs font-medium text-muted">Tipos</h3>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {CARD_CATEGORIES.filter((category) => stats.byCategory[category] > 0).map((category) => (
            <li key={category} className="flex justify-between">
              <span className="text-muted">{CARD_CATEGORY_LABELS[category]}</span>
              <span className="tabular-nums">{stats.byCategory[category]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-surface-raised/60 px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

/** Curva de maná: una barra por valor de maná; la altura crece con una transición suave. */
function ManaCurve({ curve }: { curve: number[] }) {
  const max = Math.max(1, ...curve);
  return (
    <section aria-label="Curva de maná">
      <h3 className="mb-2 text-xs font-medium text-muted">Curva de maná (sin tierras)</h3>
      <div className="flex h-24 items-end gap-1.5">
        {curve.map((value, manaValue) => {
          const label = manaValue === CURVE_BUCKETS - 1 ? `${manaValue}+` : String(manaValue);
          return (
            <div
              key={manaValue}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              <span className="text-[11px] text-muted tabular-nums">{value || ""}</span>
              <motion.div
                className="w-full rounded-t bg-accent/70"
                initial={false}
                animate={{ height: `${(value / max) * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ minHeight: value > 0 ? 2 : 0 }}
                role="img"
                aria-label={`Valor ${label}: ${value} cartas`}
              />
              <span className="text-[11px] text-muted">{label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Lo que el mazo pide frente a lo que produce: por cada color, qué parte de los símbolos de
 * sus costes es de ese color y qué parte de sus fuentes de maná lo produce. Cuando un color
 * pide bastante más de lo que da el mazo, se dice.
 */
function ManaBalance({ stats }: { stats: DeckStats }) {
  const balance = balanceColors(stats.colorPips, stats.colorSources);
  if (balance.length === 0) return null;

  const short = balance.filter((color) => color.isShort);

  return (
    <section aria-label="Fuentes de maná">
      <h3 className="mb-2 flex items-baseline justify-between gap-2 text-xs font-medium text-muted">
        Fuentes de maná frente a los costes
        <span className="font-normal tabular-nums">{stats.manaSources} fuentes</span>
      </h3>

      <ul className="flex flex-col gap-1.5">
        {balance.map(({ color, pips, sources, pipShare, sourceShare, isShort }) => (
          <li key={color} className="flex items-center gap-2 text-xs">
            <span title={MANA_COLOR_LABELS[color]} className="shrink-0">
              <ManaSymbol symbol={`{${color}}`} decorative className="size-3.5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Share
                label={`${pips} ${pips === 1 ? "símbolo" : "símbolos"}`}
                share={pipShare}
                className="bg-foreground/40"
              />
              <Share
                label={`${sources} ${sources === 1 ? "fuente" : "fuentes"}`}
                share={sourceShare}
                className={isShort ? "bg-warning" : MANA_COLOR_CLASSES[color]}
              />
            </span>
          </li>
        ))}
      </ul>

      {short.length > 0 && (
        <p className="mt-2 flex gap-1.5 text-xs text-warning">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="text-pretty">
            {short.map((color) => MANA_COLOR_LABELS[color.color].toLowerCase()).join(" y ")}{" "}
            {short.length === 1 ? "pide" : "piden"} más de lo que produce el mazo: mira si te faltan
            fuentes de ese color.
          </span>
        </p>
      )}
    </section>
  );
}

/** Una barra con su cifra: la parte que le toca a un color, de 0 a 1. */
function Share({ label, share, className }: { label: string; share: number; className: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-raised">
        <motion.span
          className={cn("block h-full rounded-full", className)}
          initial={false}
          animate={{ width: `${Math.round(share * 100)}%` }}
          transition={{ duration: 0.3 }}
        />
      </span>
      <span className="w-20 shrink-0 text-right text-muted tabular-nums">{label}</span>
    </span>
  );
}
