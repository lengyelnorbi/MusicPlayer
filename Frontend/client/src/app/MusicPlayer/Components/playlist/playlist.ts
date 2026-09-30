import { Component} from '@angular/core';
import { TranslatePipe } from '../../../Shared/Pipes/translate-pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './playlist.html',
  styleUrl: './playlist.css',
})
export class Playlist {}
