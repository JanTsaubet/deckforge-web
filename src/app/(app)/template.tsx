import type { ReactNode } from "react";
import { PageTransition } from "@/components/motion/page-transition";

/** A diferencia de `layout.tsx`, `template.tsx` se vuelve a montar en cada navegación. */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
