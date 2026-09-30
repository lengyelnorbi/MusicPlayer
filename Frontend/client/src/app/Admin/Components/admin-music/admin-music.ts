import { Component } from '@angular/core';
import { AdminService } from '../../../Services/admin-service';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-music',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [AdminService],
  templateUrl: './admin-music.html',
  styleUrl: './admin-music.css',
})
export class AdminMusic {
  musicLink: string = '';

  constructor(private adminService: AdminService) {}

  onUploadMusic() {
    // Handle the music upload logic here
    console.log('Uploading music from link:', this.musicLink);
    this.adminService.uploadMusic(this.musicLink);
    // You can add your upload logic here, such as making an HTTP request to your backend
  }

  async downloadAllMusic() {
    // Handle the download all music logic here
    console.log('Downloading all music');
    // You can add your download logic here, such as making an HTTP request to your backend
    await this.adminService.downloadAllMusic();
  }
}
