import { AlertTriangle, CircleCheck, CircleX, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { DeckIssue, IssueLevel } from "../lib/deck-validation";

interface DeckIssuesProps {
  issues: DeckIssue[];
  /** Qué decir cuando no hay ningún problema. */
  okMessage?: string;
  className?: string;
}

const ISSUE_STYLES: Record<IssueLevel, { icon: typeof Info; className: string }> = {
  error: { icon: CircleX, className: "text-danger" },
  warning: { icon: AlertTriangle, className: "text-warning" },
  info: { icon: Info, className: "text-muted" },
};

/** Lo que el mazo incumple (o le falta) según las reglas de su formato. */
export function DeckIssues({
  issues,
  okMessage = "El mazo cumple las reglas del formato.",
  className,
}: DeckIssuesProps) {
  if (issues.length === 0) {
    return (
      <p className={cn("flex gap-2 text-sm text-success", className)}>
        <CircleCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {okMessage}
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-1.5", className)}>
      {issues.map((issue) => {
        const { icon: Icon, className: iconClassName } = ISSUE_STYLES[issue.level];
        return (
          <li key={issue.message} className="flex gap-2 text-xs">
            <Icon className={cn("mt-0.5 size-3.5 shrink-0", iconClassName)} aria-hidden />
            <span className="text-pretty">{issue.message}</span>
          </li>
        );
      })}
    </ul>
  );
}
