import { Component, OnInit, HostListener, ElementRef, QueryList, ViewChildren, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnDestroy } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Observable, BehaviorSubject, Subject, Subscription, map, of } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Music } from '../../Models/music';
import { MusicService } from '../../../Services/music-service';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../Shared/Pipes/translate-pipe';
import { ApiConfigService } from '../../../Services/api-config-service';
import { PaginationCountPipe } from '../../../Shared/Pipes/pagination-count-pipe';
import { Playlist } from '../../Models/playlist';
import { FormsModule } from '@angular/forms';
import { PlaylistService } from '../../../Services/playlist-service';
import { AudioPlayerService } from '../../../Services/audio-player-service';
import { MusicUploadRequestService } from '../../../Services/music-upload-request-service';
import { firstValueFrom } from 'rxjs';
import { MusicTitlePipe } from '../../../Shared/Pipes/music-title-pipe';

@Component({
  selector: 'app-music-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, TranslatePipe, PaginationCountPipe, FormsModule, MusicTitlePipe],
  providers: [MusicService, ApiConfigService, PlaylistService],
  templateUrl: './music-list.html',
  styleUrl: './music-list.css',
})

export class MusicList implements OnDestroy, OnInit {
  loggedIn: boolean = false; // Ez a vÃ¡ltozÃ³ jelzi, hogy a felhasznÃ¡lÃ³ be van-e jelentkezve
  musics$!: Observable<Music[]>;
  displayedColumns = ['title', 'addedAt'];
  selectedMusicUrl = ''; // TÃ¡rolja a kivÃ¡lasztott zene URL-jÃ©t
  selectedMusicID: number | null = null; // TÃ¡rolja a kivÃ¡lasztott zene ID-jÃ©t
  maxItemCount: number = 0; // Default items per page, can be updated based on API response
  currentPage: number = 1; // To keep track of the current page number for pagination
  maxPageCount: number = 0; // To keep track of the current page number for pagination
  paginationItems: Array<number | 'ellipsis'> = [];
  limit: number = 10; // Number of items per page
  readonly limitOptions = [10, 25, 50, 75, 100];
  searchTerm = '';
  availableGenres: string[] = [];
  selectedGenres: string[] = [];
  showPlaylistOverlay: boolean = false;
  musicIDs: number[] = []; // TÃ¡rolja az Ã¶sszes zene ID-jÃ©t a listÃ¡ban
  userPlaylists: Playlist[] = [];
  showNewPlaylistInput: boolean = false;
  newPlaylistName: string = '';
  selectedMusicPlaylistIds: number[] = []; // TÃ¡rolja az Ã¶sszes lejÃ¡tszÃ¡si listÃ¡t a felhasznÃ¡lÃ³hoz
  musicList: Music[] = []; // TÃ¡rolja az Ã¶sszes zenÃ©t a listÃ¡ban
  requestUrl = '';
  requestLoading = false;
  requestMessage = '';
  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

 @ViewChildren('scrollable') scrollable!: QueryList<ElementRef>;

  constructor(
    private musicService: MusicService,
    private router: Router,
    private apiConfigService: ApiConfigService,
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
    private playlistService: PlaylistService,
    private audioPlayerService: AudioPlayerService,
    private musicUploadRequestService: MusicUploadRequestService
  ) {}

  async requestMusic(): Promise<void> {
    if (!this.loggedIn || !this.requestUrl.trim() || this.requestLoading) return;
    this.requestLoading = true;
    this.requestMessage = '';
    try {
      await firstValueFrom(this.musicUploadRequestService.create(this.requestUrl.trim()));
      this.requestUrl = '';
      this.requestMessage = 'Music request sent to the administrator.';
    } catch (error) {
      console.error('Could not send music request', error);
      this.requestMessage = 'Could not send the music request.';
    } finally {
      this.requestLoading = false;
    }
  }

  ngOnInit() {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem('userSourceLoggedInUsername')) {
        this.loggedIn = true;
      }
    }
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(2000),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.setMusicList();
    });
    this.setMusicList();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.searchSubject.complete();
  }

  setMusicList(): void {
    // Prevent server-side rendering from calling the API — only fetch in browser.
    if (typeof window === 'undefined') { this.musics$ = of([]); return; }
    console.log('Initializing Music List component');
    console.trace('Music List component initialized, fetching Music');
    this.musics$ = this.musicService.getMusicList(
      this.currentPage,
      this.limit,
      this.searchTerm,
      this.selectedGenres
    ).pipe(
      map(result => {
        this.maxItemCount = result.totalItemCount;
        this.maxPageCount = result.totalPages;
        this.availableGenres = result.availableGenres ?? [];
        this.updatePaginationItems();
        this.userPlaylists = result.userPlaylists ?? [];
        this.musicList = result.items ?? [];
        result.items?.forEach(music => {
          console.log('playlistIDs:', music.playlistIDs);
        });
        return result.items ?? [];
      })
    );
  } 

  onSearchChanged(search: string): void {
    this.searchTerm = search;
    this.searchSubject.next(search);
  }

  toggleGenre(genre: string, checked: boolean): void {
    this.selectedGenres = checked
      ? [...new Set([...this.selectedGenres, genre])]
      : this.selectedGenres.filter(selectedGenre => selectedGenre !== genre);
    this.currentPage = 1;
    this.setMusicList();
  }

  onLimitChanged(value: string): void {
    const nextLimit = Number(value);
    if (!this.limitOptions.includes(nextLimit)) return;

    this.limit = nextLimit;
    this.currentPage = 1;
    this.setMusicList();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedGenres = [];
    this.currentPage = 1;
    this.searchSubject.next('');
    this.setMusicList();
  }

  refreshMusicList(response: any): void {
    console.log('BEFORE refresh:', this.userPlaylists);

    this.userPlaylists = [
      ...this.userPlaylists,
      response.result
    ];

    console.log('AFTER refresh:', this.userPlaylists);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.maxPageCount) {
      console.warn(`Invalid page number: ${page}. Must be between 1 and ${this.maxPageCount}.`);
      return;
    }
    this.currentPage = page;
    this.updatePaginationItems();
    console.log(`Navigating to page ${page} of Playlists`);
    this.setMusicList();
  }

  goToPaginationItem(page: number | 'ellipsis'): void {
    if (page !== 'ellipsis') {
      this.goToPage(page);
    }
  }

  private updatePaginationItems(): void {
    const totalPages = this.maxPageCount;
    const currentPage = this.currentPage;

    if (totalPages <= 7) {
      this.paginationItems = Array.from({ length: totalPages }, (_, index) => index + 1);
      return;
    }

    const pages = new Set<number>([1, totalPages - 2, totalPages - 1, totalPages]);

    if (currentPage <= 5) {
      pages.add(2);
      pages.add(3);
      pages.add(4);
      pages.add(5);
    } else if (currentPage < totalPages - 4) {
      pages.add(currentPage - 1);
      pages.add(currentPage);
      pages.add(currentPage + 1);
    } else if (currentPage >= totalPages - 4) {
      pages.add(totalPages - 5);
      pages.add(totalPages - 4);
      pages.add(totalPages - 3);
    }

    const sortedPages = [...pages].sort((a, b) => a - b);
    const items: Array<number | 'ellipsis'> = [];

    sortedPages.forEach((page, index) => {
      if (index > 0 && page - sortedPages[index - 1] > 1) {
        items.push('ellipsis');
      }
      items.push(page);
    });

    this.paginationItems = items;
  }

  createNewPlaylist(): void {
    this.showNewPlaylistInput = true;
  }

  createPlaylist(): void {
    this.playlistService.createPlaylist(this.newPlaylistName).then((response) => {
      console.log('Playlist created successfully:', response);
      this.showNewPlaylistInput = false;
      this.newPlaylistName = '';
      if(response.ok) {
        this.refreshMusicList(response);

        this.showNewPlaylistInput = false;
        this.newPlaylistName = '';
      }
    }).catch((error) => {
      console.error('Error creating playlist:', error);
    });
  }

  cancelNewPlaylist(): void {
    this.showNewPlaylistInput = false;
    this.newPlaylistName = '';
  }

  // @HostListener('window:scroll', [])
  // onWindowScroll() {
  //   const pos = (window.innerHeight + window.scrollY);
  //   const max = document.documentElement.scrollHeight;
    
  //   // Ha a felhasznÃ¡lÃ³ 200 pixelre megkÃ¶zelÃ­ti az oldal aljÃ¡t -> BetÃ¶ltÃ©s triggerelÃ©se
  //   if (pos >= max - 200) {
  //     this.musicService.loadMoreMusic();
  //   }
  // }

  activeMusicId: number | null = null; // TÃ¡rolja az Ã©ppen kattintÃ¡ssal kijelÃ¶lt zenÃ©t
  openMenuId: number | null = null;   // TÃ¡rolja, hogy melyik zene 3 pontos menÃ¼je van nyitva

  // Zene kijelÃ¶lÃ©se kattintÃ¡sra
  playMusic(music: Music): void {
    this.activeMusicId = music.id;
    this.audioPlayerService.playTrack(music, this.musicList);
  }

  onAudioEnded() {
    this.activeMusicId = null;
    this.selectedMusicUrl = '';
  }

  // 3 pontos menÃ¼ nyitÃ¡sa/zÃ¡rÃ¡sa
  toggleMenu(id: number) {
    if (this.openMenuId === id) {
      this.openMenuId = null; // Ha ugyanarra kattint, bezÃ¡rja
    } else {
      this.openMenuId = id;   // Kinyitja a kivÃ¡lasztottat
    }
  }

  // Ha bÃ¡rhova mÃ¡shova kattint a felhasznÃ¡lÃ³, a kis 3 pontos menÃ¼ bezÃ¡rul
  @HostListener('document:click', [])
  closeMenu() {
    this.openMenuId = null;
  }

  openPlaylistOverlay() {
    this.showPlaylistOverlay = true;
  }

  closePlaylistOverlay() {
    this.showPlaylistOverlay = false;
    this.selectedMusicID = null;
    this.showNewPlaylistInput = false;
    this.newPlaylistName = '';
  }

  // MenÃ¼ funkciÃ³k
  onSaveToPlaylist(music: Music) {
    this.selectedMusicID = music.id;
    this.selectedMusicPlaylistIds = [...music.playlistIDs];
    this.openMenuId = null;
    this.openPlaylistOverlay();
  }

  saveOrRemoveMusicToPlaylist(playlistId: number, shouldAdd: boolean) {
    if (this.selectedMusicID == null) {
      console.error('No music selected for playlist operation.');
      return;
    }

    if (shouldAdd) {
      this.musicService.addMusicToPlaylist(playlistId, this.selectedMusicID).then((success) => {
        if (success) {
          this.ngZone.run(() => {
            this.selectedMusicPlaylistIds = [...new Set([...this.selectedMusicPlaylistIds, playlistId])];
            this.changeDetectorRef.detectChanges();
          });
          console.log(`Zene sikeresen hozzáadva a lejátszási listához: ${playlistId}`);
        } else {
          console.error(`Hiba történt a zene hozzáadásakor a lejátszási listához: ${playlistId}`);
        }
      }).catch((error) => {
        console.error(`Hiba történt a zene hozzáadásakor a lejátszási listához: ${playlistId}`, error);
      });
    } else {
      this.musicService.removeMusicFromPlaylist(playlistId, this.selectedMusicID).then((success) => {
        if (success) {
          this.ngZone.run(() => {
            this.selectedMusicPlaylistIds = this.selectedMusicPlaylistIds.filter(id => id !== playlistId);
            this.changeDetectorRef.detectChanges();
          });
          console.log(`Zene sikeresen eltávolítva a lejátszási listából: ${playlistId}`);
        } else {
          console.error(`Hiba történt a zene eltávolításakor a lejátszási listából: ${playlistId}`);
        }
      }).catch((error) => {
        console.error(`Hiba történt a zene eltávolításakor a lejátszási listából: ${playlistId}`, error);
      });
    }
  }

   onDeleteFromPlaylist(id: number) {
    console.log(`Zene tÃ¶rlÃ©se a lejÃ¡tszÃ¡si listÃ¡bÃ³l: ${id}`);
    this.openMenuId = null;
    this.musicService.removeMusicFromPlaylist(1, id).then((success) => {
      if (success) {
        console.log(`Zene sikeresen eltÃ¡volÃ­tva a lejÃ¡tszÃ¡si listÃ¡bÃ³l: ${id}`);
      } else {
        console.error(`Hiba tÃ¶rtÃ©nt a zene eltÃ¡volÃ­tÃ¡sakor a lejÃ¡tszÃ¡si listÃ¡bÃ³l: ${id}`);
      }
    });
  }

  async onDownload(id: number) {
    console.log(`Zene letÃ¶ltÃ©se: ${id}`);
    this.openMenuId = null;
  }

  onAddToFavorites(id: number) {
    console.log(`Zene hozzÃ¡adva a kedvencekhez: ${id}`);
    this.openMenuId = null;
  }
}
