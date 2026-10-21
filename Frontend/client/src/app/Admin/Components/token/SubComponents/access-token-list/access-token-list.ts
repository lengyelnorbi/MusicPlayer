import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnChanges, OnDestroy, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { TokenService } from '../../../../../Services/token-service';
import { Observable } from 'rxjs/internal/Observable';
import { AccessToken } from '../../../../../MusicPlayer/Models/access-token';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../../Shared/Pipes/translate-pipe';
import { MatTableModule } from '@angular/material/table';
import { RefreshToken } from '../../../../../MusicPlayer/Models/refresh-token';
import { of } from 'rxjs/internal/observable/of';
import { map, tap } from 'rxjs/operators';
import { PaginationCountPipe } from '../../../../../Shared/Pipes/pagination-count-pipe';

@Component({
  selector: 'app-access-token-list',
  imports: [CommonModule, MatTableModule, PaginationCountPipe],
  standalone: true,
  templateUrl: './access-token-list.html',
  styleUrl: './access-token-list.css'
})
export class AccessTokenList implements OnDestroy, AfterViewInit {
  accessTokens$!: Observable<AccessToken[]>;
  displayedColumns = ['id','jti', 'Device','IpAddress','Expiration','CreatedAt','isRevoked', 'UserID', 'Username', 'Role', 'Email'];
  flippedTokenId: number | null = 0; // Track which token is flipped
  maxItemCount: number = 0; // Default items per page, can be updated based on API response
  currentPage: number = 1; // To keep track of the current page number for pagination
  maxPageCount: number = 0; // To keep track of the current page number for pagination
  limit: number = 10; // Number of items per page
  activeAccessTokenId: number | null = null; // Tárolja az éppen kattintással kijelölt felhasználót
  openMenuId: number | null = null;   // Tárolja, hogy melyik felhasználó 3 pontos menüje van nyitva

  @ViewChildren('accessTokenCard') cards!: QueryList<ElementRef>;
  @ViewChildren('scrollable') scrollable!: QueryList<ElementRef>;
  @ViewChildren('tokenButtons') tokenButtons!: QueryList<ElementRef>;

  constructor(private tokenService: TokenService, private cdr: ChangeDetectorRef) {
    console.log('AccessTokenList component constructor');
  }

  ngOnInit() {
    // this.accessTokens$ = of([]); // Initialize with an empty observable to prevent template errors
    this.setAccessTokens();
  }

  ngAfterViewInit() {
    this.setItemsContainerMaxHeight();
  }


  setItemsContainerMaxHeight(): void {
    setTimeout(() => {
      var maxHeight = this.getCardInnerMaxHeights();
      var maxTokenButtonsHeight = this.getTokenButtonMaxHeights();
      this.scrollable.forEach(scroll => {
        scroll.nativeElement.style.maxHeight = `${maxHeight + maxTokenButtonsHeight}px`; // 40px padding
        console.log('Set scrollable container max height to:', scroll.nativeElement.style.maxHeight);
      });
    });
  }

  getCardInnerMaxHeights(): number {
    var maxHeight = 0;
    this.cards.forEach(card => {
      const frontSide = card.nativeElement.querySelector('.flip-front');
      const backSide = card.nativeElement.querySelector('.flip-back');

      const cardMaxHeight = Math.max(frontSide.scrollHeight, backSide.scrollHeight);

      maxHeight = cardMaxHeight;

      card.nativeElement.style.maxHeight = `${maxHeight}px`;
    });
    console.log('Calculated max card inner height:', maxHeight);
    return maxHeight;
  }
  
  getTokenButtonMaxHeights(): number {
    var maxHeight = 0;
    this.tokenButtons.forEach(button => {
      if(button.nativeElement.scrollHeight > maxHeight) {
        maxHeight = button.nativeElement.scrollHeight;
      }
    });
    console.log('Calculated max token button height:', maxHeight);
    return maxHeight;
  }


  setAccessTokens(): void {
    console.log('Initializing AccessTokenList component');
    console.trace('AccessTokenList component initialized, fetching access tokens');
    this.accessTokens$ = this.tokenService.getAccessTokenList(this.currentPage, this.limit).pipe(
      map(result => {
        this.maxItemCount = result.totalItemCount;
        this.maxPageCount = result.totalPages;
        result.items.forEach(token => {
          console.log('Fetched Access Token:', token);
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
    this.setAccessTokens();
  }

  // @HostListener('window:scroll', [])
  // onWindowScroll() {
  //   const pos = (window.innerHeight + window.scrollY);
  //   const max = document.documentElement.scrollHeight;
    
  //   // Ha a felhasználó 200 pixelre megközelíti az oldal alját -> Betöltés triggerelése
  //   if (pos >= max - 200) {
  //     this.tokenService.loadMoreAccessTokens();
  //     console.log('Scrolled near bottom, loading more access tokens');
  //   }
  // }



  // Felhasználó kijelölése kattintásra
  selectAccessToken(id: number, accessToken: AccessToken) {
    this.activeAccessTokenId = id;
    console.log(`Kiválasztott Access Token User ID: ${id}`);
    console.log('Kiválasztott Access Token részletek:', accessToken);
  }

  // 3 pontos menü nyitása/zárása
  toggleMenu(id: number) {
    if (this.openMenuId === id) {
      this.openMenuId = null; // Ha ugyanarra kattint, bezárja
    } else {
      this.openMenuId = id;   // Kinyitja a kiválasztottat
    }
  }

  // Flip token card
  toggleFlip(id: number, event: Event) {
    event.stopPropagation();
    this.flippedTokenId = this.flippedTokenId === id ? null : id;
  }

  // Ha bárhova máshova kattint a felhasználó, a kis 3 pontos menü bezárul
  @HostListener('document:click', [])
  closeMenu() {
    this.openMenuId = null;
  }

  // Placeholder for onSave if not defined elsewhere
  async onRevoke(id: number) {
    console.log('Revoke token:', id);
    const success = await this.tokenService.revokeAccessToken(id);
    if (success) {
      this.setAccessTokens(); // Refresh the list after revocation
      this.cdr.detectChanges(); // Frissíti a nézetet, hogy eltávolítsa a visszavont tokent
    }
  }

  // removeRevokedTokenFromList(id: number) {
  //   this.accessTokens$ = this.accessTokens$.pipe(
  //     map(tokens => tokens.filter(token => token.id !== id))
  //   );
  // }

  ngOnDestroy() {
    this.tokenService.clearAccessTokenLists();
  }
}