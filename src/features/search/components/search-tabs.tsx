"use client";

import { motion } from "motion/react";
import type { Route } from "next";
import Link from "next/link";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils/cn";
import { SEARCH_TABS, type SearchTabId } from "../types/search-tab";

/** Pestañas Cartas/Mazos. El fondo activo se desliza entre pestañas con `layoutId`. */
export function SearchTabs({ activeTab }: { activeTab: SearchTabId }) {
  return (
    <div
      role="tablist"
      aria-label="Tipo de búsqueda"
      className="inline-flex w-fit rounded-lg border border-border bg-surface p-1"
    >
      {SEARCH_TABS.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <Link
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            href={`${routes.search}?tab=${tab.id}` as Route}
            scroll={false}
            className={cn(
              "relative rounded-md px-4 py-1.5 text-sm transition-colors duration-200",
              isActive ? "text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="search-tab-indicator"
                className="absolute inset-0 rounded-md bg-surface-raised"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
