import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MusicList } from '../music-list/music-list';
import { Navigation } from '../navigation/navigation';
import { Playlist } from '../playlist/playlist';
import { MusicPlayerLogin } from '../../../Login/Components/music-player-login/music-player-login';

@Component({
  selector: 'app-main',
  imports: [CommonModule, MusicList, Navigation, Playlist, MusicPlayerLogin],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main implements OnInit {
  activeTab: 'music-list' | 'playlists' | 'login' = 'music-list';

  constructor(private route: ActivatedRoute) {
    
  }

  ngOnInit(): void {
    // Determine activeTab based on current route
    this.route.url.subscribe(urlSegments => {
      // Check if we're on :lang/home/login route (third segment is 'login')
      if (urlSegments.length > 2 && urlSegments[2]?.path === 'login') {
        this.activeTab = 'login';
      } else if (urlSegments.length > 2 && urlSegments[2]?.path === 'playlists') {
        // Check if we're on :lang/home/playlists route
        this.activeTab = 'playlists';
      } else {
        // Default to music-list for :lang/home/music-player route
        this.activeTab = 'music-list';
      }
    });
  }
}
