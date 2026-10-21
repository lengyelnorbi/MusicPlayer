import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from '../navigation/navigation';
import { AudioPlayer } from '../audio-player/audio-player';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navigation, AudioPlayer],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {}
