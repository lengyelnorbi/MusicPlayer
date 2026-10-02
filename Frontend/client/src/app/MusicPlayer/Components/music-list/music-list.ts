import { Component, OnInit, HostListener, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { Music } from '../../Models/music';
import { MusicService } from '../../../Services/music-service';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../Shared/Pipes/translate-pipe';
import { ApiConfigService } from '../../../Services/api-config-service';
import { PagedResult } from '../../../Shared/Utils/PagedResult';
import { PaginationCountPipe } from '../../../Shared/Pipes/pagination-count-pipe';

@Component({
  selector: 'app-music-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, TranslatePipe, PaginationCountPipe],
  templateUrl: './music-list.html',
  styleUrl: './music-list.css',
})

export class MusicList implements OnInit {
  loggedIn: boolean = false; // Ez a változó jelzi, hogy a felhasználó be van-e jelentkezve
  musics$!: Observable<Music[]>;
  displayedColumns = ['title', 'addedAt'];
  selectedMusicUrl = ''; // Tárolja a kiválasztott zene URL-jét
  selectedMusicID: number | null = null; // Tárolja a kiválasztott zene ID-jét
  maxItemCount: number = 0; // Default items per page, can be updated based on API response
  currentPage: number = 1; // To keep track of the current page number for pagination
  maxPageCount: number = 0; // To keep track of the current page number for pagination
  limit: number = 10; // Number of items per page

 @ViewChildren('scrollable') scrollable!: QueryList<ElementRef>;

  constructor(private musicService: MusicService, private router: Router, private apiConfigService: ApiConfigService) {}

  ngOnInit() {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem('userSourceLoggedInUsername')) {
      // A kódod többi része...
      }
    }
    this.loggedIn = true; //For development purposes, set to true. In production, this should be determined by actual authentication logic.
    this.setMusicList();
  }

  setMusicList(): void {
    console.log('Initializing Music List component');
    console.trace('Music List component initialized, fetching Music');
    this.musics$ = this.musicService.getMusicList(this.currentPage, this.limit).pipe(
      map(result => {
        this.maxItemCount = result.totalItemCount;
        this.maxPageCount = result.totalPages;
        result.items.forEach(music => {
          console.log('Fetched Music:', music);
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
    console.log(`Navigating to page ${page} of Playlists`);
    this.setMusicList();
  }

  // @HostListener('window:scroll', [])
  // onWindowScroll() {
  //   const pos = (window.innerHeight + window.scrollY);
  //   const max = document.documentElement.scrollHeight;
    
  //   // Ha a felhasználó 200 pixelre megközelíti az oldal alját -> Betöltés triggerelése
  //   if (pos >= max - 200) {
  //     this.musicService.loadMoreMusic();
  //   }
  // }

  activeMusicId: number | null = null; // Tárolja az éppen kattintással kijelölt zenét
  openMenuId: number | null = null;   // Tárolja, hogy melyik zene 3 pontos menüje van nyitva

  // Zene kijelölése kattintásra
  selectMusic(id: number) {
    this.activeMusicId = id;
    this.selectedMusicUrl = this.apiConfigService.getEndpoint(`/api/music/${id}/stream`);
  }

  onAudioEnded() {
    this.activeMusicId = null;
    this.selectedMusicUrl = '';
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
  onSaveToPlaylist(id: number) {
    console.log(`Zene mentése lejátszási listára: ${id}`);
    this.openMenuId = null;
    this.musicService.addMusicToPlaylist(1, id).then((success) => {
      if (success) {
        console.log(`Zene sikeresen hozzáadva a lejátszási listához: ${id}`);
      } else {
        console.error(`Hiba történt a zene hozzáadásakor a lejátszási listához: ${id}`);
      }
    });
  }

   onDeleteFromPlaylist(id: number) {
    console.log(`Zene törlése a lejátszási listából: ${id}`);
    this.openMenuId = null;
    this.musicService.removeMusicFromPlaylist(1, id).then((success) => {
      if (success) {
        console.log(`Zene sikeresen eltávolítva a lejátszási listából: ${id}`);
      } else {
        console.error(`Hiba történt a zene eltávolításakor a lejátszási listából: ${id}`);
      }
    });
  }

  async onDownload(id: number) {
    console.log(`Zene letöltése: ${id}`);
    this.openMenuId = null;
  }

  onAddToFavorites(id: number) {
    console.log(`Zene hozzáadva a kedvencekhez: ${id}`);
    this.openMenuId = null;
  }
}
