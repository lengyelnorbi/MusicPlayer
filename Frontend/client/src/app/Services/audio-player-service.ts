import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Music } from '../MusicPlayer/Models/music';

@Injectable({
  providedIn: 'root'
})
export class AudioPlayerService {
  private trackSubject = new BehaviorSubject<Music | null>(null);

  track$ = this.trackSubject.asObservable();

  playTrack(track: Music): void {
    this.trackSubject.next(track);
    console.log('Playing track:', track);
  }
}