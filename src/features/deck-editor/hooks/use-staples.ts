"use client";

import { useQuery } from "@tanstack/react-query";
import type { ManaColor } from "@/features/cards/types/card";
import { fetchStaples } from "../api/catalog-staples";

/**
 * Cartas de más por función, para poder descartar las que el mazo ya tiene y seguir
 * enseñando unas cuantas.
 */
const PER_ROLE = 16;

/**
 * Recomendaciones para la identidad del comandante. Sin comandante no hay identidad y no se
 * pide nada. Cambian una vez al día (cuando se sincroniza el catálogo), así que se guardan
 * durante toda la sesión.
 */
export function useStaples(identity: ManaColor[] | undefined) {
  return useQuery({
    queryKey: ["catalog", "staples", identity?.join("") ?? ""],
    queryFn: ({ signal }) => fetchStaples(identity ?? [], PER_ROLE, signal),
    enabled: identity !== undefined,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
