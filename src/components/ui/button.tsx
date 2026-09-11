import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

const variantClasses = {
  primary: "bg-accent text-accent-foreground hover:brightness-110",
  secondary: "border border-border bg-surface-raised text-foreground hover:bg-border/60",
  ghost: "text-muted hover:bg-surface-raised hover:text-foreground",
} as const;

const sizeClasses = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
} as const;

export type ButtonVariant = keyof typeof variantClasses;
export type ButtonSize = keyof typeof sizeClasses;

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/**
 * Clases del botón expuestas como función para reutilizarlas en elementos que
 * no son <button> (p. ej. <Link>) sin duplicar estilos.
 */
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium select-none",
    "transition-[background-color,color,filter,scale] duration-200 ease-smooth",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export type ButtonProps = ComponentProps<"button"> & Omit<ButtonStyleOptions, "className">;

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
