import { Component, ElementRef, OnInit, ViewChild, ApplicationRef, ComponentRef, EnvironmentInjector, OnDestroy, createComponent } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MusicService } from '../../../Services/music-service';
import { Music } from '../../Models/music';
import { AudioPlayerService } from '../../../Services/audio-player-service';
import { AudioPlayerPipComponent } from './SubComponents/audio-player-pip/audio-player-pip';


@Component({
  selector: 'app-audio-player',
  imports: [CommonModule,FormsModule],
  providers: [MusicService],
  templateUrl: './audio-player.html',
  styleUrl: './audio-player.css',
})

export class AudioPlayer implements OnInit, OnDestroy {

  @ViewChild('audioPlayer')
  audioPlayer!: ElementRef<HTMLAudioElement>;

  private pipWindow: Window | null = null;

  private pipComponentRef: ComponentRef<AudioPlayerPipComponent> | null = null;

  // =========================================================
  // CURRENT TRACK
  // =========================================================
  currentTrack: Music = new Music();
  currentTrackIndex: number = 0;
  playlistName: string = 'My Playlist';
  trackQueue: Music[] = [];

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

  constructor(private musicService: MusicService, private audioPlayerService: AudioPlayerService,
  private applicationRef: ApplicationRef, private environmentInjector: EnvironmentInjector) {}

  ngOnInit(): void {
    this.setupPiPEventListeners();
    this.audioPlayerService.track$.subscribe(track => {
      if (!track) return;
      console.log('Received track from audio player service:', track);
      this.currentTrack = track;
      this.loadAndPlayTrack();
    });

    this.audioPlayerService.queue$.subscribe(queue => {
      if (!queue) return;
      console.log('Received queue from audio player service:', queue);
      this.trackQueue = queue;
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
        .then(() => { 
          this.isPlaying = true;
          this.audioPlayerService.setPlaying(true);
         })
        .catch(error => {
          console.error('Unable to play audio:', error);
          this.isPlaying = false;
          this.audioPlayerService.setPlaying(false);
        });
    } 
    else {
      audio.pause();
      this.isPlaying = false;
      this.audioPlayerService.setPlaying(false);
    }
  }

  playTrack(track: Music): void {
    const index = this.trackQueue.findIndex(item => item.id === track.id);

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
          this.audioPlayerService.setPlaying(true);
        })
        .catch(error => {
          console.error('Unable to play track:', error);
          this.isPlaying = false;
          this.audioPlayerService.setPlaying(false);
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
    if (this.trackQueue.length === 0) {
      return;
    }

    if (this.isShuffleEnabled) {
      const nextIndex = this.getRandomTrackIndex();
      this.currentTrackIndex = nextIndex;
    }
    else if (this.currentTrackIndex < this.trackQueue.length - 1) {
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

    this.currentTrack = this.trackQueue[this.currentTrackIndex];
    this.progress = 0;
    this.trackCurrentTime = 0;
    this.audioPlayerService.setCurrentTrackIndex(this.currentTrackIndex);
    this.audioPlayerService.setCurrentTrack(this.currentTrack);
    this.loadAndPlayTrack();
  }

  previousTrack(): void {
    if (this.trackQueue.length === 0) {
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
      this.currentTrackIndex = this.trackQueue.length - 1;
    }
    else {
      this.currentTrackIndex = 0;
    }

    this.currentTrack = this.trackQueue[this.currentTrackIndex];
    this.progress = 0;
    this.trackCurrentTime = 0;
    this.audioPlayerService.setCurrentTrackIndex(this.currentTrackIndex);
    this.audioPlayerService.setCurrentTrack(this.currentTrack);
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
    this.audioPlayerService.setShuffle(this.isShuffleEnabled);
  }

  private getRandomTrackIndex(): number {
    if (this.trackQueue.length <= 1) {
      return this.currentTrackIndex;
    }

    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * this.trackQueue.length);
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
    this.audioPlayerService.setRepeat(this.repeatMode);
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

    this.audioPlayerService.setVolume(this.volume);

    this.audioPlayerService.setMuted(this.isMuted);
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

    this.audioPlayerService.setVolume(this.volume);

    this.audioPlayerService.setMuted(this.isMuted);
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
    this.progress =
      (this.trackCurrentTime / this.trackDuration) * 100;
  } else {
    this.progress = 0;
  }

  // Sync with PiP
  this.audioPlayerService.setCurrentTime(
    this.trackCurrentTime
  );

  this.audioPlayerService.setDuration(
    this.trackDuration
  );

  this.audioPlayerService.setVolume(this.volume);

  this.audioPlayerService.setMuted(this.isMuted);
}

  onMetadataLoaded(event: Event): void {
    const audio = event.target as HTMLAudioElement;
    if (!audio) {
      return;
    }
    this.trackDuration = audio.duration;
    audio.volume = this.isMuted ? 0 : this.volume;

    this.audioPlayerService.setDuration(this.trackDuration);
  }

  togglePlayerExtension(): void {
    this.isPlayerExtended = !this.isPlayerExtended;
  }

  togglePlaylistVisibility(): void {
    this.isPlaylistOpen = !this.isPlaylistOpen;
  }

  selectTrack(index: number): void {
    if ( index < 0 || index >= this.trackQueue.length ) {
      return;
    }
    this.currentTrackIndex = index;
    this.currentTrack = this.trackQueue[index];
    this.progress = 0;
    this.trackCurrentTime = 0;
    this.trackDuration = 0;
    this.audioPlayerService.setCurrentTrackIndex(this.currentTrackIndex);
    this.audioPlayerService.setCurrentTrack(this.currentTrack);
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













  private get documentPiP(): any {
  if (typeof window === 'undefined') {
    return null;
  }

  return (window as any).documentPictureInPicture ?? null;
}

  get canUsePictureInPicture(): boolean {
    return !!this.documentPiP;
  }

  async togglePictureInPicture(): Promise<void> {
  const pip = (window as any).documentPictureInPicture;

  if (!pip) {
    return;
  }

  // Already open → close it
  if (pip.window) {
    this.closePictureInPicture();
    return;
  }

  try {
    const pipWindow: Window = await pip.requestWindow({
      width: 450,
      height: 500
    });
    this.pipWindow = pipWindow;
    this.setupPiPWindow(pipWindow);

  } catch (error) {
    console.error('Failed to open Picture-in-Picture:', error);
    this.pipWindow = null;
  }
}

  private setupPiPWindow(pipWindow: Window): void {
  const pipDocument = pipWindow.document;

  pipDocument.body.style.margin = '0';
  pipDocument.body.style.padding = '0';
  pipDocument.body.style.width = '100%';
  pipDocument.body.style.height = '100%';
  pipDocument.body.style.overflow = 'hidden';

  const container = pipDocument.createElement('div');

  container.id = 'audio-player-pip';
  container.style.width = '100%';
  container.style.height = '100%';

  pipDocument.body.appendChild(container);

  // Create Angular component FIRST.
  this.mountPiPComponent(
    pipWindow,
    container
  );

  // Angular has now inserted the component CSS
  // into the main document, so copy it afterwards.
  this.copyStylesToPiP(pipDocument);
}

private copyStylesToPiP(
  pipDocument: Document
): void {

  // Copy <link rel="stylesheet">
  document
    .querySelectorAll('link[rel="stylesheet"]')
    .forEach(link => {

      const clone =
        link.cloneNode(true) as HTMLLinkElement;

      pipDocument.head.appendChild(clone);
    });

  // Copy <style> elements
  document
    .querySelectorAll('style')
    .forEach(style => {

      const clone =
        style.cloneNode(true) as HTMLStyleElement;

      pipDocument.head.appendChild(clone);
    });
}

  private mountPiPComponent(
  pipWindow: Window,
  container: HTMLElement
): void {


  this.pipComponentRef = createComponent(
    AudioPlayerPipComponent,
    {
      environmentInjector: this.environmentInjector,
      hostElement: container
    }
  );
  this.pipComponentRef.setInput(
    'mainWindow',
    window
  );
  this.pipComponentRef.setInput(
    'closePiP',
    () => this.closePictureInPicture()
  );

  this.applicationRef.attachView(
    this.pipComponentRef.hostView
  );

  this.pipComponentRef.changeDetectorRef.detectChanges();

  pipWindow.addEventListener(
    'pagehide',
    () => {
      this.destroyPiPComponent();
      this.pipWindow = null;
    },
    { once: true }
  );
}
private destroyPiPComponent(): void {
  if (!this.pipComponentRef) {
    return;
  }

  this.applicationRef.detachView(
    this.pipComponentRef.hostView
  );

  this.pipComponentRef.destroy();

  this.pipComponentRef = null;
}
closePictureInPicture(): void {
  if (this.pipWindow) {
    this.pipWindow.close();
  }

  this.destroyPiPComponent();
  this.pipWindow = null;
}
















private setupPiPEventListeners(): void {

  window.addEventListener(
    'audio-player-toggle',
    this.handlePiPToggle
  );

  window.addEventListener(
    'audio-player-previous',
    this.handlePiPPrevious
  );

  window.addEventListener(
    'audio-player-next',
    this.handlePiPNext
  );

  window.addEventListener(
    'audio-player-shuffle',
    this.handlePiPShuffle
  );

  window.addEventListener(
    'audio-player-repeat',
    this.handlePiPRepeat
  );

  window.addEventListener(
    'audio-player-mute',
    this.handlePiPMute
  );

  window.addEventListener(
    'audio-player-volume',
    this.handlePiPVolume
  );

  window.addEventListener(
    'audio-player-seek',
    this.handlePiPSeek
  );

  window.addEventListener(
    'audio-player-select-track',
    this.handlePiPSelectTrack
  );
}

private handlePiPToggle = (): void => {
  this.togglePlayPause();
};

private handlePiPPrevious = (): void => {
  this.previousTrack();
};

private handlePiPNext = (): void => {
  this.nextTrack();
};

private handlePiPShuffle = (): void => {
  this.toggleShuffle();
};

private handlePiPRepeat = (): void => {
  this.cycleRepeatMode();
};

private handlePiPMute = (): void => {
  this.toggleMute();
};

private handlePiPVolume = (event: Event): void => {
  const customEvent = event as CustomEvent<number>;

  const value = customEvent.detail;

  if (typeof value !== 'number') {
    return;
  }

  this.volume = value;

  if (this.volume === 0) {
    this.isMuted = true;
  } else {
    this.isMuted = false;
    this.previousVolume = this.volume;
  }

  this.updateAudioVolume();

  this.audioPlayerService.setVolume(this.volume);
  this.audioPlayerService.setMuted(this.isMuted);
};

private handlePiPSeek = (event: Event): void => {
  const customEvent = event as CustomEvent<number>;

  const value = customEvent.detail;

  if (typeof value !== 'number') {
    return;
  }

  if (!this.audioPlayer) {
    return;
  }

  const audio = this.audioPlayer.nativeElement;

  if (!Number.isFinite(value)) {
    return;
  }

  audio.currentTime = value;

  this.trackCurrentTime = value;

  this.audioPlayerService.setCurrentTime(value);
};

private handlePiPSelectTrack = (event: Event): void => {
  const customEvent = event as CustomEvent<number>;

  const index = customEvent.detail;

  if (typeof index !== 'number') {
    return;
  }

  this.selectTrack(index);
};

ngOnDestroy(): void {

  window.removeEventListener(
    'audio-player-toggle',
    this.handlePiPToggle
  );

  window.removeEventListener(
    'audio-player-previous',
    this.handlePiPPrevious
  );

  window.removeEventListener(
    'audio-player-next',
    this.handlePiPNext
  );

  window.removeEventListener(
    'audio-player-shuffle',
    this.handlePiPShuffle
  );

  window.removeEventListener(
    'audio-player-repeat',
    this.handlePiPRepeat
  );

  window.removeEventListener(
    'audio-player-mute',
    this.handlePiPMute
  );

  window.removeEventListener(
    'audio-player-volume',
    this.handlePiPVolume
  );

  window.removeEventListener(
    'audio-player-seek',
    this.handlePiPSeek
  );

  window.removeEventListener(
    'audio-player-select-track',
    this.handlePiPSelectTrack
  );

  this.destroyPiPComponent();
}
}