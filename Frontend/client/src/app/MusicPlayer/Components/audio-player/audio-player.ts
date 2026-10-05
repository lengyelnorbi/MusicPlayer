import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MusicService } from '../../../Services/music-service';
import { Music } from '../../Models/music';
import { AudioPlayerService } from '../../../Services/audio-player-service';


@Component({
  selector: 'app-audio-player',
  imports: [CommonModule,FormsModule],
  providers: [MusicService],
  templateUrl: './audio-player.html',
  styleUrl: './audio-player.css',
})

export class AudioPlayer implements OnInit {

  @ViewChild('audioPlayer')
  audioPlayer!: ElementRef<HTMLAudioElement>;

  // =========================================================
  // CURRENT TRACK
  // =========================================================
  currentTrack: Music = new Music();
  currentTrackIndex: number = 0;
  playlistTracks: Music[] = [];
  playlistName: string = 'My Playlist';

  // =========================================================
  // PLAYER STATE
  // =========================================================
  isPlaying: boolean = false;
  isPlayerExtended: boolean = false;
  isPlaylistOpen: boolean = false;

  // =========================================================
  // CONTROL STATE
  // =========================================================
  isShuffleEnabled: boolean = false;
  repeatMode: 'none' | 'one' | 'all' = 'none';
  volume: number = 1;
  isMuted: boolean = false;
  previousVolume: number = 1;

  // =========================================================
  // PROGRESS
  // =========================================================
  progress: number = 0;
  trackDuration: number = 0.0;
  trackCurrentTime: number = 0.0;
  audioPlayerURL: string = '';

  constructor(private musicService: MusicService, private audioPlayerService: AudioPlayerService) {}

  ngOnInit(): void {
    this.audioPlayerService.track$.subscribe(track => {
      if (!track) return;
      console.log('Received track from audio player service:', track);
      this.currentTrack = track;
      this.loadAndPlayTrack();
    });
  }

  seekAudio(event: Event): void {
    if (!this.audioPlayer) return;

    const input = event.target as HTMLInputElement;
    const seekTime = Number(input.value);
    const audio = this.audioPlayer.nativeElement;

    audio.currentTime = seekTime;
    this.trackCurrentTime = seekTime;
  }

  getCurrentTrackUrl(): string {
    if (!this.currentTrack || !this.currentTrack.id) {
      return '';
    }
    console.log('Fetching stream URL for track ID:', this.currentTrack.id);
    return this.musicService.streamMusicByID(
      this.currentTrack.id
    );
  }

  togglePlayPause(): void {
    if (!this.audioPlayer) {
      return;
    }
    const audio = this.audioPlayer.nativeElement;

    if (audio.paused) {
      audio.play()
        .then(() => { this.isPlaying = true; })
        .catch(error => {
          console.error('Unable to play audio:', error);
          this.isPlaying = false;
        });
    } 
    else {
      audio.pause();
      this.isPlaying = false;
    }
  }

  playTrack(track: Music): void {
    const index = this.playlistTracks.findIndex(item => item.id === track.id);

    if (index === -1) {
      return;
    }

    this.currentTrackIndex = index;
    this.currentTrack = track;
    this.progress = 0;
    this.trackCurrentTime = 0;
    this.trackDuration = 0;
    this.loadAndPlayTrack();
  }

  private loadAndPlayTrack(): void {
    if (!this.audioPlayer) return;

    console.log('Loading and playing track:', this.currentTrack);
    const audio = this.audioPlayer.nativeElement;
    const url = this.getCurrentTrackUrl();

    this.audioPlayerURL = url;
    audio.src = url;

    this.progress = 0;
    this.trackCurrentTime = 0;
    this.trackDuration = 0;

    audio.volume = this.isMuted ? 0 : this.volume;

    audio.oncanplay = () => {
      audio.play()
        .then(() => {
          this.isPlaying = true;
        })
        .catch(error => {
          console.error('Unable to play track:', error);
          this.isPlaying = false;
        });
    };

    audio.load();
  }

  pauseTrack(): void {
    if (!this.audioPlayer) {
      return;
    }

    const audio = this.audioPlayer.nativeElement;
    audio.pause();
    this.isPlaying = false;
  }

  nextTrack(): void {
    if (this.playlistTracks.length === 0) {
      return;
    }

    if (this.isShuffleEnabled) {
      const nextIndex = this.getRandomTrackIndex();
      this.currentTrackIndex = nextIndex;
    }
    else if (this.currentTrackIndex < this.playlistTracks.length - 1) {
      this.currentTrackIndex++;
    }
    else if (this.repeatMode === 'all') {
      this.currentTrackIndex = 0;
    }
    else {
      this.isPlaying = false;
      if (this.audioPlayer) {
        this.audioPlayer.nativeElement.pause();
      }
      return;
    }

    this.currentTrack = this.playlistTracks[this.currentTrackIndex];
    this.progress = 0;
    this.trackCurrentTime = 0;
    this.loadAndPlayTrack();
  }

  previousTrack(): void {
    if (this.playlistTracks.length === 0) {
      return;
    }

    if (this.audioPlayer && this.audioPlayer.nativeElement.currentTime > 3) {
      this.audioPlayer.nativeElement.currentTime = 0;
      return;
    }

    if (this.currentTrackIndex > 0) {
      this.currentTrackIndex--;
    }
    else if (this.repeatMode === 'all') {
      this.currentTrackIndex = this.playlistTracks.length - 1;
    }
    else {
      this.currentTrackIndex = 0;
    }

    this.currentTrack = this.playlistTracks[this.currentTrackIndex];
    this.progress = 0;
    this.trackCurrentTime = 0;
    this.loadAndPlayTrack();
  }

  onTrackEnded(): void {
    if (this.repeatMode === 'one') {
      if (!this.audioPlayer) {
        return;
      }
      const audio = this.audioPlayer.nativeElement;
      audio.currentTime = 0;
      audio.play();
      this.isPlaying = true;
      return;
    }

    this.nextTrack();
  }

  toggleShuffle(): void {
    this.isShuffleEnabled = !this.isShuffleEnabled;
  }

  private getRandomTrackIndex(): number {
    if (this.playlistTracks.length <= 1) {
      return this.currentTrackIndex;
    }

    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * this.playlistTracks.length);
    } 
    while (randomIndex === this.currentTrackIndex);

    return randomIndex;
  }

  cycleRepeatMode(): void {
    switch (this.repeatMode) {
      case 'none':
        this.repeatMode = 'one';
        break;
      case 'one':
        this.repeatMode = 'all';
        break;
      case 'all':
        this.repeatMode = 'none';
        break;
    }
  }

  get repeatModeLabel(): string {
    switch (this.repeatMode) {
      case 'one':
        return 'Repeat one';
      case 'all':
        return 'Repeat all';
      default:
        return 'Repeat off';
    }
  }

  toggleMute(): void {
    if (this.isMuted) {
      this.isMuted = false;
      this.volume = this.previousVolume > 0 ? this.previousVolume : 1;
    }
    else {
      this.previousVolume = this.volume > 0 ? this.volume : 1;
      this.isMuted = true;
    }

    this.updateAudioVolume();
  }

  onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.volume = Number(input.value);

    if (this.volume === 0) {
      this.isMuted = true;
    }
    else {
      this.isMuted = false;
      this.previousVolume = this.volume;
    }

    this.updateAudioVolume();
  }

  private updateAudioVolume(): void {
    if (!this.audioPlayer) {
      return;
    }
    const audio = this.audioPlayer.nativeElement;
    audio.volume = this.isMuted ? 0 : this.volume;
  }

  updateProgress(event: Event): void {
    const audio = event.target as HTMLAudioElement;
    if (!audio) {
      return;
    }
    this.trackCurrentTime = audio.currentTime;
    this.trackDuration = audio.duration || 0;
    if (this.trackDuration > 0) {
      this.progress = (this.trackCurrentTime / this.trackDuration) * 100;
    }
    else {
      this.progress = 0;
    }
  }

  onMetadataLoaded(event: Event): void {
    const audio = event.target as HTMLAudioElement;
    if (!audio) {
      return;
    }
    this.trackDuration = audio.duration;
    audio.volume = this.isMuted ? 0 : this.volume;
  }

  togglePlayerExtension(): void {
    this.isPlayerExtended = !this.isPlayerExtended;
  }

  togglePlaylistVisibility(): void {
    this.isPlaylistOpen = !this.isPlaylistOpen;
  }

  selectTrack(index: number): void {
    if ( index < 0 || index >= this.playlistTracks.length ) {
      return;
    }
    this.currentTrackIndex = index;
    this.currentTrack = this.playlistTracks[index];
    this.progress = 0;
    this.trackCurrentTime = 0;
    this.trackDuration = 0;
    this.loadAndPlayTrack();
  }

  formatTime(seconds: number): string {
    if ( !seconds || !isFinite(seconds)) {
      return '00:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return ( String(minutes).padStart(2, '0') + ':' + String(remainingSeconds).padStart(2, '0'));
  }
}