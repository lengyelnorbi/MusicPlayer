export class PagedResult<T> {
    totalItemCount!: number;
    totalPages!: number;
    items: T[] = [];
}