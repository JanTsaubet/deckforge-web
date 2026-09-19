import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { getServerEnv } from "@/config/env";
import type { components } from "@/lib/api/openapi";
import { createHttpClient } from "@/lib/http/http-client";
import type { SocialProvider } from "../lib/social-providers";

type AuthProviders = components["schemas"]["AuthProvidersDto"];

const DEFAULT_API_BASE_URL = "http://localhost:4000";

/**
 * Proveedores OAuth que la API tiene configurados. Si la API no responde, ninguno: es
 * preferible no enseñar botones a enseñar botones que fallan. El acceso con email sigue ahí.
 *
 * Se consulta en cada petición (`connection()`): si la página se generase al compilar, se
 * quedaría para siempre con los proveedores de ese momento (o con ninguno, si la API no
 * estaba levantada), aunque luego se configuren credenciales.
 */
export async function loadSocialProviders(): Promise<SocialProvider[]> {
  await connection();
  try {
    // Información pública: no hace falta reenviar las cookies del usuario.
    const http = createHttpClient(getServerEnv().API_BASE_URL ?? DEFAULT_API_BASE_URL);
    const { social } = await http.get<AuthProviders>("/v1/auth/providers", { cache: "no-store" });
    return social;
  } catch (error) {
    // Las señales internas de Next (p. ej. "esta ruta es dinámica") no son errores: se dejan pasar.
    unstable_rethrow(error);
    console.error("No se han podido cargar los proveedores de acceso", error);
    return [];
  }
}
