"use client";

import { Folder, FolderOpen, FolderPlus, Inbox, Layers, Pencil, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import {
  createFolderAction,
  deleteFolderAction,
  renameFolderAction,
} from "../actions/folder-actions";
import { MAX_FOLDER_NAME_LENGTH } from "../constants/deck-limits";
import { libraryHref, UNFILED_FOLDER, type LibraryFilters } from "../lib/library-filters";
import type { DeckFolder } from "../types/deck";

interface FolderNavProps {
  folders: DeckFolder[];
  filters: LibraryFilters;
  /** Mazos por carpeta (id → número), más el total y los que no tienen carpeta. */
  counts: { all: number; unfiled: number; byFolder: Record<string, number> };
}

const ITEM =
  "relative flex h-9 items-center gap-2 rounded-lg px-3 text-sm whitespace-nowrap transition-colors duration-200";

const ICON_BUTTON =
  "grid size-7 place-items-center rounded-md text-muted transition-[opacity,color] duration-200 can-hover:opacity-0 can-hover:group-hover:opacity-100 can-hover:focus-visible:opacity-100";

/**
 * Carpetas de la biblioteca. En escritorio es una columna lateral; en móvil, una fila que se
 * desplaza en horizontal. El fondo del elemento activo se desliza de uno a otro (`layoutId`).
 * Cambiar de carpeta solo cambia la URL: el resto de filtros se conserva.
 */
export function FolderNav({ folders, filters, counts }: FolderNavProps) {
  const hrefFor = (folder: string) => libraryHref({ ...filters, folder });

  return (
    <nav aria-label="Carpetas" className="min-w-0">
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        <FolderLink
          href={hrefFor("")}
          label="Todos los mazos"
          count={counts.all}
          icon={Layers}
          isActive={filters.folder === ""}
        />
        {folders.length > 0 && (
          <FolderLink
            href={hrefFor(UNFILED_FOLDER)}
            label="Sin carpeta"
            count={counts.unfiled}
            icon={Inbox}
            isActive={filters.folder === UNFILED_FOLDER}
          />
        )}
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            count={counts.byFolder[folder.id] ?? 0}
            href={hrefFor(folder.id)}
            isActive={filters.folder === folder.id}
            hrefWhenGone={hrefFor("")}
          />
        ))}
        <li className="shrink-0">
          <NewFolder />
        </li>
      </ul>
    </nav>
  );
}

interface FolderLinkProps {
  href: ReturnType<typeof libraryHref>;
  label: string;
  count: number;
  icon: typeof Folder;
  isActive: boolean;
}

function FolderLink({ href, label, count, icon: Icon, isActive }: FolderLinkProps) {
  return (
    <li className="relative shrink-0">
      <ActiveBackground isActive={isActive} />
      <FolderAnchor href={href} label={label} count={count} icon={Icon} isActive={isActive} />
    </li>
  );
}

function ActiveBackground({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  return (
    <motion.span
      layoutId="folder-nav-indicator"
      className="absolute inset-0 rounded-lg bg-surface-raised"
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
    />
  );
}

function FolderAnchor({ href, label, count, icon: Icon, isActive }: FolderLinkProps) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        ITEM,
        "min-w-0 flex-1",
        isActive ? "text-foreground" : "text-muted hover:text-foreground",
      )}
    >
      <Icon className={cn("size-4 shrink-0", isActive && "text-accent")} aria-hidden />
      <span className="truncate">{label}</span>
      <span className="ml-auto pl-2 text-xs text-muted tabular-nums">{count}</span>
    </Link>
  );
}

interface FolderItemProps {
  folder: DeckFolder;
  count: number;
  href: ReturnType<typeof libraryHref>;
  isActive: boolean;
  /** A dónde ir si se borra la carpeta que se está viendo. */
  hrefWhenGone: ReturnType<typeof libraryHref>;
}

/** Una carpeta del usuario: enlace, más renombrar (en línea) y borrar (con confirmación). */
function FolderItem({ folder, count, href, isActive, hrefWhenGone }: FolderItemProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  async function remove(): Promise<string | void> {
    const result = await deleteFolderAction(folder.id);
    if (!result.ok) return result.error;
    toast.success(`Carpeta «${folder.name}» borrada.`);
    if (isActive) router.replace(hrefWhenGone, { scroll: false });
  }

  if (isEditing) {
    return (
      <li className="shrink-0">
        <FolderNameForm
          initialName={folder.name}
          label={`Nuevo nombre para ${folder.name}`}
          onDone={() => setIsEditing(false)}
          save={(name) => renameFolderAction(folder.id, name)}
        />
      </li>
    );
  }

  return (
    <li className="group relative flex shrink-0 items-center">
      <ActiveBackground isActive={isActive} />
      <FolderAnchor
        href={href}
        label={folder.name}
        count={count}
        icon={isActive ? FolderOpen : Folder}
        isActive={isActive}
      />
      <div className="relative flex pr-1">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Renombrar la carpeta ${folder.name}`}
          title="Renombrar"
          className={cn(ICON_BUTTON, "hover:text-foreground")}
        >
          <Pencil className="size-3.5" aria-hidden />
        </button>
        <ConfirmDialog
          title="¿Borrar esta carpeta?"
          description={
            count === 0 ? (
              <>La carpeta «{folder.name}» está vacía.</>
            ) : count === 1 ? (
              <>El mazo de «{folder.name}» no se borra: pasa a «Sin carpeta».</>
            ) : (
              <>
                Los {count} mazos de «{folder.name}» no se borran: pasan a «Sin carpeta».
              </>
            )
          }
          confirmLabel="Borrar carpeta"
          destructive
          onConfirm={remove}
          trigger={(open) => (
            <button
              type="button"
              onClick={open}
              aria-label={`Borrar la carpeta ${folder.name}`}
              title="Borrar"
              className={cn(ICON_BUTTON, "hover:text-danger")}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          )}
        />
      </div>
    </li>
  );
}

function NewFolder() {
  const [isCreating, setIsCreating] = useState(false);

  if (isCreating) {
    return (
      <FolderNameForm
        initialName=""
        label="Nombre de la carpeta nueva"
        onDone={() => setIsCreating(false)}
        save={createFolderAction}
        successMessage={(name) => `Carpeta «${name}» creada.`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsCreating(true)}
      className={cn(ITEM, "w-full text-muted hover:bg-surface-raised/60 hover:text-foreground")}
    >
      <FolderPlus className="size-4" aria-hidden />
      Nueva carpeta
    </button>
  );
}

interface FolderNameFormProps {
  initialName: string;
  label: string;
  save: (name: string) => Promise<{ ok: boolean; error?: string }>;
  onDone: () => void;
  successMessage?: (name: string) => string;
}

/**
 * Nombre de carpeta editable en línea: Enter guarda, Escape cancela, y salir del campo
 * guarda si se ha escrito algo distinto (como al renombrar en un explorador de archivos).
 */
function FolderNameForm({ initialName, label, save, onDone, successMessage }: FolderNameFormProps) {
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  // Enter envía y desactiva el campo; en algunos navegadores eso provoca un `blur` que
  // volvería a enviar (y crearía la carpeta dos veces). Solo vale el primer envío.
  const submitted = useRef(false);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (submitted.current) return;
    submitted.current = true;
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) {
      onDone();
      return;
    }
    startTransition(async () => {
      const result = await save(trimmed);
      if (!result.ok) {
        submitted.current = false;
        toast.error(result.error ?? "No se ha podido guardar la carpeta.");
        return;
      }
      if (successMessage) toast.success(successMessage(trimmed));
      onDone();
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter se gestiona aquí y no con el envío implícito del navegador, que depende de cómo
    // llegue la tecla. Durante una composición (IME), Enter confirma el texto: no envía.
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    } else if (event.key === "Escape") {
      // Sin esto, Escape también cerraría un <dialog> que contuviera el formulario.
      event.preventDefault();
      onDone();
    }
  }

  return (
    <form onSubmit={submit}>
      <input
        aria-label={label}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => submit()}
        disabled={isPending}
        maxLength={MAX_FOLDER_NAME_LENGTH}
        placeholder="Nombre de la carpeta"
        // Aparece justo cuando se pide: el foco debe ir a él.
        autoFocus
        className="h-9 w-full min-w-40 rounded-lg border border-accent bg-surface px-3 text-sm outline-none disabled:opacity-60"
      />
    </form>
  );
}
