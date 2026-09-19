import type { DeckFolder } from "../types/deck";

/**
 * Carpetas de la biblioteca del usuario. Contrato aparte del de mazos (segregación de
 * interfaces): quien solo lee o escribe mazos no tiene por qué saber de carpetas.
 */
export interface FolderRepository {
  listMine(): Promise<DeckFolder[]>;
  create(name: string): Promise<DeckFolder>;
  rename(folderId: string, name: string): Promise<DeckFolder>;
  /** Borra la carpeta; sus mazos no se borran, se quedan sin carpeta. */
  remove(folderId: string): Promise<void>;
}
