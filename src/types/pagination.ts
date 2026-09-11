/** Página de resultados genérica, independiente de la API de origen. */
export interface Paginated<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  page: number;
}
