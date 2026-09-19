"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { routes } from "@/config/routes";
import { createServerFolderRepository } from "../api/server-deck-repository";
import { MAX_FOLDER_NAME_LENGTH } from "../constants/deck-limits";
import { describeApiError, type ActionResult } from "./action-errors";

const FOLDER_NOT_FOUND = "Esa carpeta ya no existe.";

const folderNameSchema = z
  .string()
  .trim()
  .min(1, "Ponle un nombre a la carpeta.")
  .max(MAX_FOLDER_NAME_LENGTH, `El nombre admite como mucho ${MAX_FOLDER_NAME_LENGTH} caracteres.`);

export interface FolderActionResult extends ActionResult {
  folderId?: string;
}

export async function createFolderAction(name: string): Promise<FolderActionResult> {
  const parsed = folderNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  let folderId: string;
  try {
    const repository = await createServerFolderRepository();
    folderId = (await repository.create(parsed.data)).id;
  } catch (error) {
    return { ok: false, error: describeApiError(error, FOLDER_NOT_FOUND) };
  }

  revalidatePath(routes.decks);
  return { ok: true, folderId };
}

export async function renameFolderAction(folderId: string, name: string): Promise<ActionResult> {
  const parsed = folderNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  try {
    const repository = await createServerFolderRepository();
    await repository.rename(folderId, parsed.data);
  } catch (error) {
    return { ok: false, error: describeApiError(error, FOLDER_NOT_FOUND) };
  }

  revalidatePath(routes.decks);
  return { ok: true };
}

export async function deleteFolderAction(folderId: string): Promise<ActionResult> {
  try {
    const repository = await createServerFolderRepository();
    await repository.remove(folderId);
  } catch (error) {
    return { ok: false, error: describeApiError(error, FOLDER_NOT_FOUND) };
  }

  revalidatePath(routes.decks);
  return { ok: true };
}
