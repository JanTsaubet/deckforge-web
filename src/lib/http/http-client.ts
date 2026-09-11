/** Error HTTP tipado: conserva status y cuerpo para que las capas superiores decidan qué hacer. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    public readonly body: unknown,
  ) {
    super(`HTTP ${status} en ${url}`);
    this.name = "HttpError";
  }
}

export interface HttpRequestOptions extends RequestInit {
  /** Parámetros de query string; los valores `undefined` se omiten. */
  query?: Record<string, string | number | boolean | undefined>;
}

/**
 * Cliente HTTP mínimo sobre `fetch`.
 * No conoce ninguna API concreta (SRP): cada adaptador (Scryfall, API propia…)
 * crea su instancia con su `baseUrl` y cabeceras por defecto.
 */
export function createHttpClient(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
  async function request<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    const { query, headers, ...init } = options;

    const url = new URL(path, baseUrl);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const mergedHeaders = new Headers(defaultHeaders);
    new Headers(headers).forEach((value, key) => mergedHeaders.set(key, value));

    const response = await fetch(url, { ...init, headers: mergedHeaders });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) throw new HttpError(response.status, url.toString(), body);
    return body as T;
  }

  return {
    request,
    get: <T>(path: string, options?: HttpRequestOptions) =>
      request<T>(path, { ...options, method: "GET" }),
  };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
