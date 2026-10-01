import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { Observable, BehaviorSubject } from 'rxjs';
import { Music } from '../../Models/music';
import { MusicService } from '../../../Services/music-service';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../Shared/Pipes/translate-pipe';
import { ApiConfigService } from '../../../Services/api-config-service';

@Component({
  selector: 'app-music-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, TranslatePipe],
  templateUrl: './music-list.html',
  styleUrl: './music-list.css',
})

export class MusicList implements OnInit {
  loggedIn: boolean = false; // Ez a változó jelzi, hogy a felhasználó be van-e jelentkezve
  musics$!: Observable<Music[]>;
  displayedColumns = ['title'];
  selectedMusicUrl = ''; // Tárolja a kiválasztott zene URL-jét

  constructor(private musicService: MusicService, private router: Router, private apiConfigService: ApiConfigService) {}

  ngOnInit() {
    this.musics$ = this.musicService.getMusicList();
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem('userSourceLoggedInUsername')) {
      // A kódod többi része...
      }
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const pos = (window.innerHeight + window.scrollY);
    const max = document.documentElement.scrollHeight;
    
    // Ha a felhasználó 200 pixelre megközelíti az oldal alját -> Betöltés triggerelése
    if (pos >= max - 200) {
      this.musicService.loadMoreMusic();
    }
  }

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
  onSave(id: number) {
    console.log(`Zene mentése lejátszási listára: ${id}`);
    this.openMenuId = null;
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
