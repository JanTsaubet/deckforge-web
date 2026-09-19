"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const CONTROL_CLASSES =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none transition-colors duration-200 placeholder:text-muted/70 focus:border-accent aria-[invalid=true]:border-danger";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}

function FieldShell({ id, label, hint, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

type TextFieldProps = ComponentProps<"input"> & { label: string; hint?: string };

/** Campo de texto con su etiqueta asociada (clic en la etiqueta = foco en el campo). */
export function TextField({ label, hint, id, className, ...inputProps }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell id={fieldId} label={label} hint={hint}>
      <input id={fieldId} className={cn(CONTROL_CLASSES, className)} {...inputProps} />
    </FieldShell>
  );
}

type SelectFieldProps = ComponentProps<"select"> & { label: string; hint?: string };

export function SelectField({
  label,
  hint,
  id,
  className,
  children,
  ...selectProps
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell id={fieldId} label={label} hint={hint}>
      <select id={fieldId} className={cn(CONTROL_CLASSES, className)} {...selectProps}>
        {children}
      </select>
    </FieldShell>
  );
}

/** Mensaje de error de un formulario, anunciado a los lectores de pantalla. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm">
      {children}
    </p>
  );
}
