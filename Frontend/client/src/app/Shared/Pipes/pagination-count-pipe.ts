import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'paginationCount',
})
export class PaginationCountPipe implements PipeTransform {
  transform(maxItemCount: number, pageCount: number, limit: number): string | null {
    console.log(`PaginationCountPipe called with maxItemCount=${maxItemCount}, pageCount=${pageCount}, limit=${limit}`);
    var from = (pageCount - 1) * limit + 1;
    var to = (pageCount - 1) * limit + limit;
    var result = `${from}-${to} / ${maxItemCount}`;
    if (to > maxItemCount) {
      result = `${from}-${maxItemCount} / ${maxItemCount}`;
    }
    if (maxItemCount === 0) {
      result = `0 / 0`;
    }
    return result; 
  }
}
