import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

/** Bloque de carga con brillo animado. Se usa en `loading.tsx` y en listas en espera. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-lg bg-linear-to-r from-surface via-surface-raised to-surface bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
