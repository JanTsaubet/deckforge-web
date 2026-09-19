"use client";

import { CircleHelp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils/cn";

/** Operadores más útiles de la sintaxis de Scryfall, con un ejemplo que se puede probar. */
const SYNTAX_EXAMPLES = [
  { example: "t:creature", description: "Tipo de carta" },
  { example: 'o:"draw a card"', description: "Texto de reglas" },
  { example: "c:rg", description: "Colores: incluye rojo y verde" },
  { example: "id<=wub", description: "Legal con un comandante blanco, azul y negro" },
  { example: "mv<=3", description: "Valor de maná" },
  { example: "r:mythic", description: "Rareza" },
  { example: "f:commander", description: "Legal en un formato" },
  { example: "is:commander", description: "Puede ser comandante" },
] as const;

interface SyntaxHelpProps {
  /** Se llama con el ejemplo elegido para añadirlo a la búsqueda. */
  onPick: (example: string) => void;
}

/**
 * Chuleta de la sintaxis de Scryfall. Cada ejemplo se puede pulsar para probarlo:
 * se aprende antes probando que leyendo documentación.
 */
export function SyntaxHelp({ onPick }: SyntaxHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") setIsOpen(false);
  }

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        aria-label="Ayuda de sintaxis"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface text-muted transition-colors duration-200 hover:text-foreground",
          isOpen && "border-accent text-foreground",
        )}
      >
        <CircleHelp className="size-5" aria-hidden />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={panelId}
            role="dialog"
            aria-label="Ayuda de sintaxis de Scryfall"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full right-0 z-30 mt-2 w-80 origin-top-right rounded-xl border border-border bg-surface-raised p-3 shadow-xl"
          >
            <header className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">Sintaxis de búsqueda</p>
              <button
                type="button"
                aria-label="Cerrar ayuda"
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-muted transition-colors duration-200 hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            </header>

            <ul className="flex flex-col">
              {SYNTAX_EXAMPLES.map(({ example, description }) => (
                <li key={example}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(example);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-accent/10"
                  >
                    <code className="font-mono text-xs text-accent">{example}</code>
                    <span className="text-xs text-muted">{description}</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="mt-2 border-t border-border pt-2 text-[11px] text-muted">
              Pulsa un ejemplo para añadirlo a tu búsqueda.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
