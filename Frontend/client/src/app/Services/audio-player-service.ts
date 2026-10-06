import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Music } from '../MusicPlayer/Models/music';

@Injectable({
  providedIn: 'root'
})
export class AudioPlayerService {
  private trackSubject = new BehaviorSubject<Music | null>(null);
  private queue: BehaviorSubject<Music[]> = new BehaviorSubject<Music[]>([]);

  track$ = this.trackSubject.asObservable();
  queue$ = this.queue.asObservable();

  playTrack(track: Music, queue: Music[]): void {
    this.trackSubject.next(track);
    this.queue.next(queue);
    console.log('Playing track:', track);
  }


  private currentTrackIndexSubject =
    new BehaviorSubject<number>(0);

  private playlistNameSubject =
    new BehaviorSubject<string>('');

  private playingSubject =
    new BehaviorSubject<boolean>(false);

  private currentTimeSubject =
    new BehaviorSubject<number>(0);

  private durationSubject =
    new BehaviorSubject<number>(0);

  private volumeSubject =
    new BehaviorSubject<number>(1);

  private mutedSubject =
    new BehaviorSubject<boolean>(false);

  private shuffleSubject =
    new BehaviorSubject<boolean>(false);

  private repeatSubject =
    new BehaviorSubject<'none' | 'one' | 'all'>('none');





  currentTrackIndex$ =
    this.currentTrackIndexSubject.asObservable();

  playlistName$ =
    this.playlistNameSubject.asObservable();

  playing$ =
    this.playingSubject.asObservable();

  currentTime$ =
    this.currentTimeSubject.asObservable();

  duration$ =
    this.durationSubject.asObservable();

  volume$ =
    this.volumeSubject.asObservable();

  muted$ =
    this.mutedSubject.asObservable();

  shuffle$ =
    this.shuffleSubject.asObservable();

  repeat$ =
    this.repeatSubject.asObservable();


  setCurrentTrackIndex(index: number): void {
    this.currentTrackIndexSubject.next(index);
  }


  setPlaylistName(name: string): void {
    this.playlistNameSubject.next(name);
  }


  setCurrentTrack(track: Music): void {
    this.trackSubject.next(track);
  }

  setPlaying(value: boolean): void {
    this.playingSubject.next(value);
  }

  setCurrentTime(value: number): void {
    this.currentTimeSubject.next(value);
  }

  setDuration(value: number): void {
    this.durationSubject.next(value);
  }

  setVolume(value: number): void {
    this.volumeSubject.next(value);
  }

  setMuted(value: boolean): void {
    this.mutedSubject.next(value);
  }

  setShuffle(value: boolean): void {
    this.shuffleSubject.next(value);
  }

  setRepeat(value: 'none' | 'one' | 'all'): void {
    this.repeatSubject.next(value);
  }

  getQueue(): Music[] | null {
    return this.queue.value;
  }

  getCurrentTrackIndex(): number {
    return this.currentTrackIndexSubject.value;
  }

  getPlaylistName(): string {
    return this.playlistNameSubject.value;
  }

  getCurrentTrack(): Music | null {
    return this.trackSubject.value;
  }

  getIsPlaying(): boolean {
    return this.playingSubject.value;
  }

  getVolume(): number {
    return this.volumeSubject.value;
  }

  getIsMuted(): boolean {
    return this.mutedSubject.value;
  }

  getShuffle(): boolean {
    return this.shuffleSubject.value;
  }

  getRepeat(): 'none' | 'one' | 'all' {
    return this.repeatSubject.value;
  }
}