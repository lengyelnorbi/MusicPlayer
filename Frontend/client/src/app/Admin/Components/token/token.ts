import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '../../../Shared/Pipes/translate-pipe';
import { TokenService } from '../../../Services/token-service';
import { AccessTokenList } from './SubComponents/access-token-list/access-token-list';
import { RefreshTokenList } from './SubComponents/refresh-token-list/refresh-token-list';
import { RefreshToken } from '../../../MusicPlayer/Models/refresh-token';
import { AccessToken } from '../../../MusicPlayer/Models/access-token';
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'app-token',
  standalone: true,
  imports: [CommonModule, MatTableModule, TranslatePipe, AccessTokenList, RefreshTokenList],
  templateUrl: './token.html',
  styleUrl: './token.css',
})
export class Token {
  activeSubTab: 'access-token' | 'refresh-token' = 'access-token';
  openMenuId: number | null = null;   // Tárolja, hogy melyik felhasználó 3 pontos menüje van nyitva

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Determine activeTab based on current route
    this.route.url.subscribe(urlSegments => {
      const lastSegment = urlSegments[urlSegments.length - 1]?.path;

      if (lastSegment === 'access-token') {
        this.activeSubTab = 'access-token';
      } else if (lastSegment === 'refresh-token') {
        this.activeSubTab = 'refresh-token';
      } else {
        this.activeSubTab = 'access-token';
      }
    });
  }

  // Listen to activeSubTab changes from AdminNavigation component
  onActiveTabChange(subTab: 'access-token' | 'refresh-token'): void {
    this.activeSubTab = subTab;
  }

  // 3 pontos menü nyitása/zárása
  toggleMenu(id: number) {
    if (this.openMenuId === id) {
      this.openMenuId = null; // Ha ugyanarra kattint, bezárja
    } else {
      this.openMenuId = id;   // Kinyitja a kiválasztottat
    }
  }
}
