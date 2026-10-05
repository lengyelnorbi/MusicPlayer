import { Component, ElementRef, HostListener, QueryList, ViewChildren} from '@angular/core';
import { TranslatePipe } from '../../../Shared/Pipes/translate-pipe';
import { CommonModule } from '@angular/common';
import { PlaylistService } from '../../../Services/playlist-service';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/internal/Observable';
import { PaginationCountPipe } from '../../../Shared/Pipes/pagination-count-pipe';
import { PagedResult } from '../../../Shared/Utils/PagedResult';
import * as Models from '../../Models/playlist';
import { of } from 'rxjs/internal/observable/of';
import { map } from 'rxjs/internal/operators/map';


@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule, TranslatePipe, PaginationCountPipe],
  providers: [PlaylistService],
  templateUrl: './playlist.html',
  styleUrl: './playlist.css',
})
export class Playlist {
  playlists$!: Observable<Models.Playlist[]>;
  displayedColumns = ['id', 'name', 'musicCount'];
  selectedPlaylistID: number | null = 0; // Track which token is flipped
  maxItemCount: number = 0; // Default items per page, can be updated based on API response
  currentPage: number = 1; // To keep track of the current page number for pagination
  maxPageCount: number = 0; // To keep track of the current page number for pagination
  limit: number = 10; // Number of items per page
  loggedIn: boolean = false; // Ez a változó jelzi, hogy a felhasználó be van-e jelentkezve

  @ViewChildren('scrollable') scrollable!: QueryList<ElementRef>;
  
  constructor(private playlistService: PlaylistService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem('userSourceLoggedInUsername')) {
        this.loggedIn = true;
        this.setUserPlaylists(1);
      }
    }
  }

  setAllPlaylists(): void {
      console.log('Initializing Playlist component');
      console.trace('Playlist component initialized, fetching Playlists');
      this.playlists$ = this.playlistService.getAllPlaylists(this.currentPage, this.limit).pipe(
        map(result => {
          this.maxItemCount = result.totalItemCount;
          this.maxPageCount = result.totalPages;
          result.items.forEach(playlist => {
            console.log('Fetched Playlist:', playlist);
          });
          return result.items ?? [];
        })
      );
    }

    setUserPlaylists(userID: number): void {
      console.log('Initializing Playlist component');
      console.trace('Playlist component initialized, fetching Playlists');
      this.playlists$ = this.playlistService.getUserPlaylists(userID, this.currentPage, this.limit).pipe(
        map(result => {
          this.maxItemCount = result.totalItemCount;
          this.maxPageCount = result.totalPages;
          result.items.forEach(playlist => {
            console.log('Fetched Playlist:', playlist);
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
      if(this.loggedIn) {
        this.setUserPlaylists(1);
      }
      else{
        this.setAllPlaylists();
      }
    }

  loadPlaylistByID(id: number): void {
    this.playlistService.getPlaylistByID(1).then((playlist) => {
      console.log('Fetched playlist by ID:', playlist);
    }).catch((error) => {
      console.error('Error fetching playlist by ID:', error);
    });
  }

  toggleMenu(id: number) {
    if (this.selectedPlaylistID === id) {
      this.selectedPlaylistID = null; // Close the menu if it's already open
    } else {
      this.selectedPlaylistID = id; // Open the menu for the selected token
    }
  }

  onAddToFavorites(id: number) {
    // Implement the logic to add the playlist to favorites
    console.log(`Adding playlist with ID ${id} to favorites.`);
  }

  onDownload(id: number) {
    // Implement the logic to download the playlist
    console.log(`Downloading playlist with ID ${id}.`);
  }

  onSave(id: number) {
    // Implement the logic to save the playlist
    console.log(`Saving playlist with ID ${id}.`);
  }

  @HostListener('document:click', [])
  closeMenu() {
    this.selectedPlaylistID = null;
  }
}
