"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils/cn";

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  /** Etiquetas que ya existen, ofrecidas como autocompletado. */
  suggestions?: string[];
  maxTags: number;
  /** Longitud máxima de cada etiqueta; lo que pase se recorta. */
  maxLength: number;
  /** Cómo se guarda una etiqueta (p. ej. en minúsculas). Se aplica al añadirla. */
  normalize?: (tag: string) => string;
}

/**
 * Campo de etiquetas: se escribe y se añade con Enter o coma; Retroceso con el campo vacío
 * quita la última. Cada etiqueta es un botón para quitarla, accesible con teclado.
 *
 * La coma se detecta en el texto, no en la tecla: así también funciona al pegar
 * "ramp, removal, draw" y con teclados móviles, que no siempre emiten eventos de tecla.
 */
export function TagInput({
  label,
  value,
  onChange,
  suggestions = [],
  maxTags,
  maxLength,
  normalize = (tag) => tag.trim(),
}: TagInputProps) {
  const inputId = useId();
  const listId = useId();
  const [draft, setDraft] = useState("");
  const isFull = value.length >= maxTags;

  /** Añade varias etiquetas de una vez, sin repetidas y sin pasar del máximo. */
  function addAll(raws: string[]) {
    const next = [...value];
    for (const raw of raws) {
      const tag = normalize(raw).slice(0, maxLength);
      if (tag && next.length < maxTags && !next.includes(tag)) next.push(tag);
    }
    if (next.length !== value.length) onChange(next);
  }

  function changeDraft(text: string) {
    // Lo que va antes de la última coma son etiquetas terminadas; lo de después, el borrador.
    const parts = text.split(",");
    const rest = parts.pop() ?? "";
    if (parts.length > 0) addAll(parts);
    setDraft(rest);
  }

  function commitDraft() {
    addAll([draft]);
    setDraft("");
  }

  function remove(tag: string) {
    onChange(value.filter((current) => current !== tag));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      // Enter no debe enviar el formulario que contiene el campo: aquí significa "añadir".
      event.preventDefault();
      commitDraft();
    } else if (event.key === "Backspace" && !draft && value.length > 0) {
      remove(value[value.length - 1] ?? "");
    }
  }

  const available = suggestions.filter((tag) => !value.includes(tag));

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1.5 transition-colors duration-200 focus-within:border-accent">
        <AnimatePresence initial={false}>
          {value.map((tag) => (
            <motion.span
              key={tag}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-1 rounded-md bg-accent/15 py-0.5 pr-1 pl-2 text-xs text-accent"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                aria-label={`Quitar la etiqueta ${tag}`}
                className="rounded p-0.5 transition-colors duration-150 hover:bg-accent/20"
              >
                <X className="size-3" aria-hidden />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          id={inputId}
          value={draft}
          onChange={(event) => changeDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          // Al salir del campo, lo escrito se añade: no se pierde por no pulsar Enter.
          onBlur={() => draft && commitDraft()}
          disabled={isFull}
          list={available.length > 0 ? listId : undefined}
          placeholder={isFull ? "" : value.length === 0 ? "cedh, presupuesto…" : ""}
          className={cn(
            "h-7 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70",
            isFull && "hidden",
          )}
        />
        <datalist id={listId}>
          {available.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>
      </div>
      <p className="text-xs text-muted">
        {value.length} de {maxTags}. Enter o coma para añadir.
      </p>
    </div>
  );
}
