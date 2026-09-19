import { cookies } from "next/headers";
import { getServerEnv } from "@/config/env";
import { createHttpClient, type HttpClient } from "@/lib/http/http-client";

const DEFAULT_API_BASE_URL = "http://localhost:4000";

/**
 * Cliente HTTP para llamar a la API desde el servidor (Server Components y Server Actions)
 * en nombre del usuario: reenvía sus cookies para que la API sepa quién es.
 *
 * Solo funciona en el servidor, porque lee las cookies de la petición en curso.
 */
export async function createServerApiClient(): Promise<HttpClient> {
  const cookieHeader = (await cookies()).toString();
  const baseUrl = getServerEnv().API_BASE_URL ?? DEFAULT_API_BASE_URL;

  return createHttpClient(baseUrl, cookieHeader ? { cookie: cookieHeader } : {});
}
