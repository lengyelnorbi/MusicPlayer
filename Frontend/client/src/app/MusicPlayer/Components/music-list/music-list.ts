import { Component, OnInit, HostListener, ElementRef, QueryList, ViewChildren, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { Observable, BehaviorSubject, map, of } from 'rxjs';
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

@Component({
  selector: 'app-music-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, TranslatePipe, PaginationCountPipe, FormsModule],
  providers: [MusicService, ApiConfigService, PlaylistService],
  templateUrl: './music-list.html',
  styleUrl: './music-list.css',
})

export class MusicList implements OnInit {
  loggedIn: boolean = false; // Ez a vÃ¡ltozÃ³ jelzi, hogy a felhasznÃ¡lÃ³ be van-e jelentkezve
  musics$!: Observable<Music[]>;
  displayedColumns = ['title', 'addedAt'];
  selectedMusicUrl = ''; // TÃ¡rolja a kivÃ¡lasztott zene URL-jÃ©t
  selectedMusicID: number | null = null; // TÃ¡rolja a kivÃ¡lasztott zene ID-jÃ©t
  maxItemCount: number = 0; // Default items per page, can be updated based on API response
  currentPage: number = 1; // To keep track of the current page number for pagination
  maxPageCount: number = 0; // To keep track of the current page number for pagination
  limit: number = 10; // Number of items per page
  showPlaylistOverlay: boolean = false;
  musicIDs: number[] = []; // TÃ¡rolja az Ã¶sszes zene ID-jÃ©t a listÃ¡ban
  userPlaylists: Playlist[] = [];
  showNewPlaylistInput: boolean = false;
  newPlaylistName: string = '';
  selectedMusicPlaylistIds: number[] = []; // TÃ¡rolja az Ã¶sszes lejÃ¡tszÃ¡si listÃ¡t a felhasznÃ¡lÃ³hoz

 @ViewChildren('scrollable') scrollable!: QueryList<ElementRef>;

  constructor(
    private musicService: MusicService,
    private router: Router,
    private apiConfigService: ApiConfigService,
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
    private playlistService: PlaylistService,
    private audioPlayerService: AudioPlayerService
  ) {}

  ngOnInit() {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem('userSourceLoggedInUsername')) {
        this.loggedIn = true;
      }
    }
    this.setMusicList();
  }

  setMusicList(): void {
    // Prevent server-side rendering from calling the API — only fetch in browser.
    if (typeof window === 'undefined') { this.musics$ = of([]); return; }
    console.log('Initializing Music List component');
    console.trace('Music List component initialized, fetching Music');
    this.musics$ = this.musicService.getMusicList(this.currentPage, this.limit).pipe(
      map(result => {
        this.maxItemCount = result.totalItemCount;
        this.maxPageCount = result.totalPages;
        this.userPlaylists = result.userPlaylists ?? [];
        result.items?.forEach(music => {
          console.log('playlistIDs:', music.playlistIDs);
        });
        return result.items ?? [];
      })
    );
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
    console.log(`Navigating to page ${page} of Playlists`);
    this.setMusicList();
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
    this.audioPlayerService.playTrack(music);
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
