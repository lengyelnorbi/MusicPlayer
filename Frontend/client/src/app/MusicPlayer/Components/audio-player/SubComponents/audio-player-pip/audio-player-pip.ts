import { Component, Input, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Music } from '../../../../Models/music';
import { AudioPlayerService } from '../../../../../Services/audio-player-service';


@Component({
  selector: 'app-audio-player-pip',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audio-player-pip.html',
  styleUrl: './audio-player-pip.css',
  encapsulation: ViewEncapsulation.None
})
export class AudioPlayerPipComponent {

  @Input()
  closePiP!: () => void;

  @Input()
  mainWindow!: Window;

  currentTrack: Music | null = null;

  playlistTracks: Music[] = [];
  playlistName = '';

  currentTrackIndex = 0;

  isPlaying = false;

  isShuffleEnabled = false;

  repeatMode: 'none' | 'one' | 'all' = 'none';

  volume = 1;
  isMuted = false;

  currentTime = 0;
  duration = 0;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private audioPlayerService: AudioPlayerService
  ) {

    this.audioPlayerService.track$
  .subscribe(track => {
    this.currentTrack = track;
    this.changeDetectorRef.detectChanges();
  });

this.audioPlayerService.queue$
  .subscribe(queue => {
    this.playlistTracks = queue;
    this.changeDetectorRef.detectChanges();
  });

this.audioPlayerService.currentTrackIndex$
  .subscribe(index => {
    this.currentTrackIndex = index;
    this.changeDetectorRef.detectChanges();
  });

this.audioPlayerService.playlistName$
  .subscribe(name => {
    this.playlistName = name;
    this.changeDetectorRef.detectChanges();
  });

this.audioPlayerService.playing$
  .subscribe(value => {
    this.isPlaying = value;
    this.changeDetectorRef.detectChanges();
  });

this.audioPlayerService.currentTime$
  .subscribe(value => {
    this.currentTime = value;
    this.changeDetectorRef.detectChanges();
  });

this.audioPlayerService.duration$
  .subscribe(value => {
    this.duration = value;
    this.changeDetectorRef.detectChanges();
  });

this.audioPlayerService.volume$
  .subscribe(value => {
    this.volume = value;
    this.changeDetectorRef.detectChanges();
  });

this.audioPlayerService.muted$
  .subscribe(value => {
    this.isMuted = value;
    this.changeDetectorRef.detectChanges();
  });

this.audioPlayerService.shuffle$
  .subscribe(value => {
    this.isShuffleEnabled = value;
    this.changeDetectorRef.detectChanges();
  });

this.audioPlayerService.repeat$
  .subscribe(value => {
    this.repeatMode = value;
    this.changeDetectorRef.detectChanges();
  });
  }

  togglePlayPause(): void {
    /*
     * The actual <audio> element lives in the main AudioPlayer.
     *
     * Dispatch an event so the main player handles playback.
     */
    this.mainWindow.dispatchEvent(
      new CustomEvent('audio-player-toggle')
    );
  }

  previousTrack(): void {
    this.mainWindow.dispatchEvent(
      new CustomEvent('audio-player-previous')
    );
  }

  nextTrack(): void {
    this.mainWindow.dispatchEvent(
      new CustomEvent('audio-player-next')
    );
  }

  toggleShuffle(): void {
    this.mainWindow.dispatchEvent(
      new CustomEvent('audio-player-shuffle')
    );
  }

  cycleRepeatMode(): void {
    this.mainWindow.dispatchEvent(
      new CustomEvent('audio-player-repeat')
    );
  }

  toggleMute(): void {
    this.mainWindow.dispatchEvent(
      new CustomEvent('audio-player-mute')
    );
  }

  onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.mainWindow.dispatchEvent(
      new CustomEvent('audio-player-volume', {
        detail: Number(input.value)
      })
    );
  }

  seekAudio(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.mainWindow.dispatchEvent(
      new CustomEvent('audio-player-seek', {
        detail: Number(input.value)
      })
    );
  }

  selectTrack(index: number): void {
    if (
      index < 0 ||
      index >= this.playlistTracks.length
    ) {
      return;
    }

    this.mainWindow.dispatchEvent(
      new CustomEvent('audio-player-select-track', {
        detail: index
      })
    );
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

  formatTime(seconds: number): string {
    if (
      !seconds ||
      !isFinite(seconds)
    ) {
      return '00:00';
    }

    const minutes =
      Math.floor(seconds / 60);

    const remainingSeconds =
      Math.floor(seconds % 60);

    return (
      String(minutes).padStart(2, '0') +
      ':' +
      String(remainingSeconds).padStart(2, '0')
    );
  }
}