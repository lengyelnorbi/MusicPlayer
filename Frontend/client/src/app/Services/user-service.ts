import { Injectable } from '@angular/core';
import { User } from '../MusicPlayer/Models/user';
import { ApiConfigService } from './api-config-service';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, startWith, of, BehaviorSubject } from 'rxjs';
import { PagedResult } from '../Shared/Utils/PagedResult';

@Injectable()
export class UserService {
  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {
    this.loadMoreUsers(); // Első adag betöltése indításkor
  }



  // Example method to fetch user data
  getUserList(page?: number, limit?: number): Observable<PagedResult<User>> {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const endpoint = this.apiConfig.getEndpoint(`/api/user${queryString}`);
    return this.http.get<PagedResult<User>>(endpoint).pipe(
      startWith({ totalItemCount: 0, totalPages: 0, items: [] }),
      catchError((error) => {
        console.error('Fetch error:', error);
        return of({ totalItemCount: 0, totalPages: 0, items: [] } as PagedResult<User>);  // Explicitly type as User[]
      })
    );
  }

  private userList = new BehaviorSubject<User[]>([]);
  // Ezt az Observable-t fogja figyelni az async pipe a HTML-ben0
  user$: Observable<User[]> = this.userList.asObservable(); 

  private currentPage = 1;
  private limit = 10;
  private isLoading = false;

  loadMoreUsers() {
    if (this.isLoading) return;
    this.isLoading = true;

    // API hívás a getUserList() metóduson keresztül
    this.getUserList(this.currentPage, this.limit).subscribe(newUsers => {
      const currentUsers = this.userList.getValue();
      // Az új felhasználókat hozzáfűzzük a meglévő listához (RxJS immutable módon)
      this.userList.next([...currentUsers, ...newUsers.items]);
      this.currentPage++;
      this.isLoading = false;
    });
  }
}
