"use client";

import { AlertTriangle, CircleX, Info } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { ManaSymbol } from "@/features/cards/components/mana-symbol";
import { MANA_COLOR_CLASSES, MANA_COLOR_LABELS } from "@/features/cards/constants/mana-colors";
import type { ManaColor } from "@/features/cards/types/card";
import { cn } from "@/lib/utils/cn";
import { CARD_CATEGORIES, CARD_CATEGORY_LABELS } from "../lib/card-category";
import { CURVE_BUCKETS, type DeckStats } from "../lib/deck-stats";
import type { DeckIssue, IssueLevel } from "../lib/deck-validation";
import { useDeckEditor } from "../store/deck-editor-context";

interface DeckAnalysisProps {
  stats: DeckStats;
  issues: DeckIssue[];
}

const EURO = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

const ISSUE_STYLES: Record<IssueLevel, { icon: typeof Info; className: string }> = {
  error: { icon: CircleX, className: "text-danger" },
  warning: { icon: AlertTriangle, className: "text-warning" },
  info: { icon: Info, className: "text-muted" },
};

/** Columna de análisis: la carta bajo el ratón, la validación y las estadísticas en vivo. */
export function DeckAnalysis({ stats, issues }: DeckAnalysisProps) {
  const previewCard = useDeckEditor((state) => state.previewCard);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative hidden aspect-[488/680] overflow-hidden rounded-xl bg-surface-raised lg:block">
        <AnimatePresence mode="popLayout" initial={false}>
          {previewCard?.imageNormal ? (
            <motion.div
              key={previewCard.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0"
            >
              <Image
                src={previewCard.imageNormal}
                alt={previewCard.name}
                fill
                unoptimized
                sizes="320px"
                className="object-cover"
              />
            </motion.div>
          ) : (
            <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted">
              Pasa el ratón por una carta para verla.
            </p>
          )}
        </AnimatePresence>
      </div>

      <section aria-label="Validación" className="flex flex-col gap-2">
        {issues.length === 0 ? (
          <p className="text-sm text-success">El mazo cumple las reglas del formato.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {issues.map((issue) => {
              const { icon: Icon, className } = ISSUE_STYLES[issue.level];
              return (
                <li key={issue.message} className="flex gap-2 text-xs">
                  <Icon className={cn("mt-0.5 size-3.5 shrink-0", className)} aria-hidden />
                  <span className="text-pretty">{issue.message}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

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
      <ColorPips pips={stats.colorPips} />

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

const PIP_COLORS: ManaColor[] = ["W", "U", "B", "R", "G"];

/** Cuántos símbolos de cada color piden los costes: orienta el reparto de tierras. */
function ColorPips({ pips }: { pips: Record<ManaColor, number> }) {
  const total = PIP_COLORS.reduce((sum, color) => sum + pips[color], 0);
  if (total === 0) return null;

  return (
    <section aria-label="Símbolos de color">
      <h3 className="mb-2 text-xs font-medium text-muted">Símbolos de color en los costes</h3>
      <div className="flex h-2 overflow-hidden rounded-full bg-surface-raised">
        {PIP_COLORS.filter((color) => pips[color] > 0).map((color) => (
          <motion.div
            key={color}
            // Clases completas de un mapa: Tailwind no ve las que se construyen con plantillas.
            className={MANA_COLOR_CLASSES[color]}
            initial={false}
            animate={{ width: `${(pips[color] / total) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-3 text-xs">
        {PIP_COLORS.filter((color) => pips[color] > 0).map((color) => (
          <li key={color} className="flex items-center gap-1" title={MANA_COLOR_LABELS[color]}>
            <ManaSymbol symbol={`{${color}}`} decorative className="size-3.5" />
            <span className="tabular-nums">{Math.round((pips[color] / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
