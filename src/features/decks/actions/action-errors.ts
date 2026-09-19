import { HttpError } from "@/lib/http/http-client";

/** Resultado de una acción: se devuelve en vez de lanzar, para mostrarlo en la interfaz. */
export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Traduce un fallo de la API a un mensaje para la persona usuaria.
 *
 * En 400 y 409 la API explica qué dato falla ("Ya tienes una carpeta llamada…") y se usa su
 * mensaje; el resto de fallos se registran y se enseña uno genérico.
 */
export function describeApiError(error: unknown, notFound = "Ese mazo ya no existe."): string {
  if (error instanceof HttpError) {
    if (error.status === 401) return "Tu sesión ha caducado. Vuelve a iniciar sesión.";
    if (error.status === 404) return notFound;
    if (error.status === 400 || error.status === 409) {
      const message = apiMessage(error.body);
      if (message) return message.endsWith(".") ? message : `${message}.`;
    }
  }
  console.error("Fallo al guardar en la API", error);
  return "No se ha podido guardar el cambio. Inténtalo de nuevo.";
}

/** NestJS responde `{ message: string | string[] }`; con varios errores, basta el primero. */
function apiMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || !("message" in body)) return undefined;
  const { message } = body;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && typeof message[0] === "string") return message[0];
  return undefined;
}
