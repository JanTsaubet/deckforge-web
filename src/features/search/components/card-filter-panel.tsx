"use client";

import { X } from "lucide-react";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { RARITY_LABELS } from "@/features/cards/constants/card-labels";
import { MANA_COLOR_CLASSES, MANA_COLOR_LABELS } from "@/features/cards/constants/mana-colors";
import type { ManaColor, Rarity } from "@/features/cards/types/card";
import { cn } from "@/lib/utils/cn";
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  MANA_COLORS,
  type CardFilters,
  type ColorMode,
  type NumericOperator,
} from "../lib/scryfall-query";

const COLOR_MODE_LABELS: Record<ColorMode, string> = {
  includes: "Incluye",
  exact: "Exactamente",
  atMost: "Como mucho",
};

const RARITY_OPTIONS: readonly Rarity[] = ["common", "uncommon", "rare", "mythic"];
const MANA_VALUE_OPERATORS: readonly NumericOperator[] = ["<=", "=", ">="];
const FORMAT_OPTIONS = [
  "commander",
  "standard",
  "pioneer",
  "modern",
  "legacy",
  "vintage",
  "pauper",
  "brawl",
] as const;

const CONTROL_CLASSES =
  "h-9 w-full rounded-lg border border-border bg-surface-raised px-2 text-sm outline-none transition-colors duration-200 focus:border-accent";

interface CardFilterPanelProps {
  filters: CardFilters;
  onChange: (filters: CardFilters) => void;
}

/**
 * Filtros visuales de la búsqueda de cartas.
 *
 * Es un componente controlado: no guarda los filtros, los recibe ya derivados de la
 * consulta de texto. Así los dos siempre dicen lo mismo.
 */
export function CardFilterPanel({ filters, onChange }: CardFilterPanelProps) {
  function toggleColor(field: "colors" | "identity", color: ManaColor) {
    const current = filters[field];
    const next = current.includes(color)
      ? current.filter((selected) => selected !== color)
      : [...current, color];

    onChange(field === "colors" ? { ...filters, colors: next } : { ...filters, identity: next });
  }

  return (
    <aside className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-4 lg:sticky lg:top-20">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Filtros</h2>
        {hasActiveFilters(filters) && (
          <button
            type="button"
            // Se conserva el texto libre: limpiar filtros no borra lo que se escribió a mano.
            onClick={() => onChange({ ...EMPTY_FILTERS, rest: filters.rest })}
            className="inline-flex items-center gap-1 text-xs text-muted transition-colors duration-200 hover:text-foreground"
          >
            <X className="size-3" aria-hidden />
            Limpiar
          </button>
        )}
      </header>

      <Field label="Colores">
        <select
          aria-label="Modo de comparación de colores"
          value={filters.colorMode}
          onChange={(event) => onChange({ ...filters, colorMode: event.target.value as ColorMode })}
          className={CONTROL_CLASSES}
        >
          {Object.entries(COLOR_MODE_LABELS).map(([mode, label]) => (
            <option key={mode} value={mode}>
              {label}
            </option>
          ))}
        </select>
        <ColorToggles
          groupLabel="Colores"
          selected={filters.colors}
          onToggle={(color) => toggleColor("colors", color)}
        />
      </Field>

      <Field label="Identidad de color" hint="Lo que permite el comandante del mazo">
        <ColorToggles
          groupLabel="Identidad de color"
          selected={filters.identity}
          onToggle={(color) => toggleColor("identity", color)}
        />
      </Field>

      <Field label="Tipo">
        {/* `key` reinicia el campo cuando el tipo cambia desde fuera (texto a mano o "Limpiar"). */}
        <TypeInput
          key={filters.type}
          value={filters.type}
          onCommit={(type) => onChange({ ...filters, type })}
        />
      </Field>

      <Field label="Rareza">
        <select
          aria-label="Rareza"
          value={filters.rarity}
          onChange={(event) => onChange({ ...filters, rarity: event.target.value as Rarity | "" })}
          className={CONTROL_CLASSES}
        >
          <option value="">Cualquiera</option>
          {RARITY_OPTIONS.map((rarity) => (
            <option key={rarity} value={rarity}>
              {RARITY_LABELS[rarity]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Valor de maná">
        <div className="flex gap-2">
          <select
            aria-label="Comparación del valor de maná"
            value={filters.manaValueOperator}
            onChange={(event) =>
              onChange({ ...filters, manaValueOperator: event.target.value as NumericOperator })
            }
            className={cn(CONTROL_CLASSES, "w-20 shrink-0")}
          >
            {MANA_VALUE_OPERATORS.map((operator) => (
              <option key={operator} value={operator}>
                {operator}
              </option>
            ))}
          </select>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            aria-label="Valor de maná"
            placeholder="cualquiera"
            value={filters.manaValue ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                manaValue: event.target.value === "" ? null : Number(event.target.value),
              })
            }
            className={CONTROL_CLASSES}
          />
        </div>
      </Field>

      <Field label="Formato">
        <select
          aria-label="Formato"
          value={filters.format}
          onChange={(event) => onChange({ ...filters, format: event.target.value })}
          className={CONTROL_CLASSES}
        >
          <option value="">Cualquiera</option>
          {FORMAT_OPTIONS.map((format) => (
            <option key={format} value={format}>
              {format[0]?.toUpperCase()}
              {format.slice(1)}
            </option>
          ))}
        </select>
      </Field>
    </aside>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted">{label}</p>
      {children}
      {hint && <p className="text-[11px] text-muted/80">{hint}</p>}
    </div>
  );
}

interface ColorTogglesProps {
  groupLabel: string;
  selected: ManaColor[];
  onToggle: (color: ManaColor) => void;
}

function ColorToggles({ groupLabel, selected, onToggle }: ColorTogglesProps) {
  return (
    <div role="group" aria-label={groupLabel} className="flex gap-1.5">
      {MANA_COLORS.map((color) => {
        const isSelected = selected.includes(color);

        return (
          <button
            key={color}
            type="button"
            aria-pressed={isSelected}
            aria-label={MANA_COLOR_LABELS[color]}
            title={MANA_COLOR_LABELS[color]}
            onClick={() => onToggle(color)}
            className={cn(
              "grid size-7 place-items-center rounded-full text-xs font-bold transition-all duration-200 ease-smooth",
              isSelected
                ? cn(
                    MANA_COLOR_CLASSES[color],
                    "scale-105 ring-2 ring-accent ring-offset-2 ring-offset-surface",
                  )
                : cn(MANA_COLOR_CLASSES[color], "opacity-35 hover:opacity-70"),
            )}
          >
            {color}
          </button>
        );
      })}
    </div>
  );
}

/**
 * El tipo se confirma al salir del campo o con Enter, no en cada tecla:
 * cambiar el filtro lanza una búsqueda, y no queremos una por pulsación.
 */
function TypeInput({ value, onCommit }: { value: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value);

  function commit() {
    if (draft !== value) onCommit(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      // Salir del campo dispara `commit`, y el remontado ocurre con el foco ya fuera.
      event.currentTarget.blur();
    }
  }

  return (
    <input
      type="text"
      aria-label="Tipo de carta"
      placeholder="creature, instant…"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={CONTROL_CLASSES}
    />
  );
}
