import { Component} from '@angular/core';
import { TranslatePipe } from '../../../Shared/Pipes/translate-pipe';
import { CommonModule } from '@angular/common';
import { PlaylistService } from '../../../Services/playlist-service';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  providers: [PlaylistService],
  templateUrl: './playlist.html',
  styleUrl: './playlist.css',
})
export class Playlist {
  constructor(private playlistService: PlaylistService) {}

  ngOnInit() {
    // Initialize the component
    this.playlistService.getPlaylists().then((playlists) => {
      console.log('Fetched playlists:', playlists);
    }).catch((error) => {
      console.error('Error fetching playlists:', error);
    });

    this.playlistService.getUserPlaylists(1).then((userPlaylists) => {
      console.log('Fetched user playlists:', userPlaylists);
    }).catch((error) => {
      console.error('Error fetching user playlists:', error);
    });
  }
}
