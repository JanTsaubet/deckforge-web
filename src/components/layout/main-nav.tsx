"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/utils/cn";

/**
 * Navegación principal. El fondo del enlace activo se desliza entre elementos
 * gracias a `layoutId` (shared layout animation de Motion).
 */
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal">
      <ul className="flex items-center gap-1">
        {mainNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href} className="relative">
              {isActive && (
                <motion.span
                  layoutId="main-nav-indicator"
                  className="absolute inset-0 rounded-md bg-surface-raised"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative block rounded-md px-3 py-1.5 text-sm transition-colors duration-200",
                  isActive ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
