export type PagedResult<T> = {
  totalItemCount: number;
  totalPages: number;
  items: T[];
};