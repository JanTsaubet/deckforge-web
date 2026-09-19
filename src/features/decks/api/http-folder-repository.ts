import type { components } from "@/lib/api/openapi";
import type { HttpClient } from "@/lib/http/http-client";
import type { FolderRepository } from "../services/folder-repository";
import type { DeckFolder } from "../types/deck";

type ApiFolder = components["schemas"]["FolderDto"];

const JSON_HEADERS = { "Content-Type": "application/json" };

/** Datos de usuario: nunca se cachean entre peticiones. */
const NO_STORE = { cache: "no-store" } as const;

/** `FolderRepository` sobre la API de DeckForge. */
export class HttpFolderRepository implements FolderRepository {
  constructor(private readonly http: HttpClient) {}

  listMine(): Promise<DeckFolder[]> {
    return this.http.get<ApiFolder[]>("/v1/folders", NO_STORE);
  }

  create(name: string): Promise<DeckFolder> {
    return this.http.request<ApiFolder>("/v1/folders", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name }),
      ...NO_STORE,
    });
  }

  rename(folderId: string, name: string): Promise<DeckFolder> {
    return this.http.request<ApiFolder>(folderPath(folderId), {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name }),
      ...NO_STORE,
    });
  }

  async remove(folderId: string): Promise<void> {
    await this.http.request<null>(folderPath(folderId), { method: "DELETE", ...NO_STORE });
  }
}

function folderPath(folderId: string): string {
  return `/v1/folders/${encodeURIComponent(folderId)}`;
}
