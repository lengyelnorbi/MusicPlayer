import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { User } from '../../../../../MusicPlayer/Models/user';
import { UserService } from '../../../../../Services/user-service';
import { TranslatePipe } from '../../../../../Shared/Pipes/translate-pipe';
import { map } from 'rxjs/operators';
import { PaginationCountPipe } from '../../../../../Shared/Pipes/pagination-count-pipe';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, TranslatePipe, PaginationCountPipe],
  providers: [UserService],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList {
  users$!: Observable<User[]>;
  displayedColumns = ['name', 'email'];
  currentPage: number = 1; // To keep track of the current page number for pagination
  limit: number = 10; // Number of items per page
  maxItemCount: number = 0; // Total number of items, to be updated based on API response
  maxPageCount: number = 0; // Total number of pages, to be updated based on API response
  activeUserId: number | null = null; // To track the currently selected user
  openMenuId: number | null = null;   // To track which user's menu is open
  isLoading: boolean = false; // To prevent multiple simultaneous load requests

  @Output() onUserSelectedEvent = new EventEmitter<User>();
  @Output() onUserUpdateEvent = new EventEmitter<User>();
  @Output() onUserUpdateCalled = new EventEmitter<User>();

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.setUsers();
  }

  setUsers(): void {
    console.log('Initializing UserList component');
    console.trace('UserList component initialized, fetching users');
    this.users$ = this.userService.getUserList(this.currentPage, this.limit).pipe(
      map(result => {
        this.maxItemCount = result.totalItemCount;
        this.maxPageCount = result.totalPages;
        result.items.forEach(user => {
          console.log('Fetched User:', user);
        });
        return result.items ?? [];
      })
    );
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.maxPageCount) {
      console.warn(`Invalid page number: ${page}. Must be between 1 and ${this.maxPageCount}.`);
      return;
    }
    this.currentPage = page;
    console.log(`Navigating to page ${page} of access tokens`);
    this.setUsers();
  }

  // @HostListener('window:scroll', [])
  // onWindowScroll() {
  //   const pos = (window.innerHeight + window.scrollY);
  //   const max = document.documentElement.scrollHeight;
    
  //   // Ha a felhasználó 200 pixelre megközelíti az oldal alját -> Betöltés triggerelése
  //   if (pos >= max - 200) {
  //     this.userService.loadMoreUsers();
  //   }
  // }

  // Felhasználó kijelölése kattintásra
  selectUser(id: number) {
    this.activeUserId = id;
  }

  // 3 pontos menü nyitása/zárása
  toggleMenu(id: number) {
    if (this.openMenuId === id) {
      this.openMenuId = null; // Ha ugyanarra kattint, bezárja
    } else {
      this.openMenuId = id;   // Kinyitja a kiválasztottat
    }
  }

  // Ha bárhova máshova kattint a felhasználó, a kis 3 pontos menü bezárul
  @HostListener('document:click', [])
  closeMenu() {
    this.openMenuId = null;
  }

  // Menü funkciók
  onSave(id: number) {
    console.log(`Felhasználó mentése: ${id}`);
    this.openMenuId = null;
  }

  onUpdateUser(user: User): void {
    console.log('Update user clicked for:', user);
    this.openMenuId = null;
    
    // Dispatch custom event to trigger update form with selected user
    this.onUserUpdateCalled.emit(user);
  }

  onUserSelected(user: User): void {
    console.log('User selected:', user);
    this.activeUserId = user.id;
    
    
  }
}
