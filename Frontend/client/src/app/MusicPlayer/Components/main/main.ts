import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from '../navigation/navigation';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navigation],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {}
