/**
 * Sin mayúsculas ni tildes: "atraxa" encuentra "Átraxa" y "Atraxa".
 *
 * Para comparar en el navegador lo que alguien escribe con lo que ve en pantalla: nadie
 * teclea las tildes cuando busca deprisa.
 */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
