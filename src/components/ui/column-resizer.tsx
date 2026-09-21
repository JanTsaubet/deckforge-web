"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils/cn";

interface ColumnResizerProps {
  /** Qué ajusta, para los lectores de pantalla: "Ancho del buscador". */
  label: string;
  /** La columna que ajusta: la que queda a su izquierda o la de su derecha. */
  side: "left" | "right";
  /** Ancho actual, si se conoce (sin él, se mide la columna al empezar). */
  value?: number;
  min: number;
  /**
   * Máximo para un ancho de partida. Se calcula al empezar a ajustar porque depende del sitio
   * que quede en pantalla: la columna central no debe quedarse sin espacio.
   */
  max: (width: number) => number;
  /** Mientras se ajusta, para verlo en vivo. */
  onResize: (width: number) => void;
  /** Al terminar de ajustar: el momento de guardarlo. */
  onResizeEnd: (width: number) => void;
  /** Doble clic: volver al ancho de siempre. */
  onReset: () => void;
  className?: string;
}

/** Píxeles por pulsación de flecha; con Mayúsculas, cuatro veces más. */
const KEY_STEP = 16;

/**
 * Asa para cambiar el ancho de una columna: se arrastra, o se enfoca y se mueve con las
 * flechas (Inicio y Fin llevan al mínimo y al máximo). Doble clic la devuelve a su ancho.
 *
 * Es un `separator` con valor, que es como las tecnologías de asistencia entienden un
 * divisor que se puede mover.
 */
export function ColumnResizer({
  label,
  side,
  value,
  min,
  max,
  onResize,
  onResizeEnd,
  onReset,
  className,
}: ColumnResizerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startWidth: number; max: number; width: number } | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);

  /** Ancho de la columna que ajusta, tal como se ve ahora mismo. */
  function currentWidth(): number {
    if (value !== undefined) return value;
    const handle = ref.current;
    const column = side === "left" ? handle?.previousElementSibling : handle?.nextElementSibling;
    return column?.getBoundingClientRect().width ?? min;
  }

  const clamp = (width: number, upper: number) =>
    Math.round(Math.min(Math.max(width, min), Math.max(min, upper)));

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    const startWidth = currentWidth();
    drag.current = {
      startX: event.clientX,
      startWidth,
      max: max(startWidth),
      width: startWidth,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    // A la derecha crece la columna de la izquierda y encoge la de la derecha.
    const delta = (event.clientX - current.startX) * (side === "left" ? 1 : -1);
    current.width = clamp(current.startWidth + delta, current.max);
    onResize(current.width);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDragging(false);
    if (current.width !== current.startWidth) onResizeEnd(current.width);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const width = currentWidth();
    const upper = max(width);
    const step = event.shiftKey ? KEY_STEP * 4 : KEY_STEP;
    // Las flechas mueven el asa: a la derecha, la columna de la izquierda crece.
    const grow = side === "left" ? 1 : -1;
    const next =
      event.key === "ArrowRight"
        ? width + step * grow
        : event.key === "ArrowLeft"
          ? width - step * grow
          : event.key === "Home"
            ? min
            : event.key === "End"
              ? upper
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    const clamped = clamp(next, upper);
    onResize(clamped);
    onResizeEnd(clamped);
  }

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={min}
      aria-valuenow={value}
      aria-valuetext={value === undefined ? "Ancho por defecto" : `${value} píxeles`}
      tabIndex={0}
      title="Arrastra para cambiar el ancho · doble clic para volver al de siempre"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex w-3 cursor-col-resize touch-none justify-center outline-none select-none",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-full w-px rounded-full bg-border transition-[background-color,width] duration-150",
          "group-hover:w-0.5 group-hover:bg-accent/60 group-focus-visible:w-0.5 group-focus-visible:bg-accent",
          isDragging && "w-0.5 bg-accent",
        )}
      />
    </div>
  );
}
