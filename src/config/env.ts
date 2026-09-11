import { z } from "zod";

/**
 * Validación de variables de entorno en tiempo de arranque.
 * Si falta o es inválida alguna variable, la app falla pronto y con un mensaje claro
 * en lugar de romperse más tarde en tiempo de ejecución.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

const serverSchema = z.object({
  API_BASE_URL: z.url().optional(),
  SCRYFALL_API_URL: z.url().default("https://api.scryfall.com"),
  SCRYFALL_USER_AGENT: z.string().min(1).default("DeckForge/0.1"),
});

/** Variables públicas. Next.js solo las incrusta si se referencian de forma explícita. */
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cachedServerEnv: ServerEnv | undefined;

/** Variables privadas. Llamar únicamente desde código que se ejecute en el servidor. */
export function getServerEnv(): ServerEnv {
  cachedServerEnv ??= serverSchema.parse(process.env);
  return cachedServerEnv;
}
