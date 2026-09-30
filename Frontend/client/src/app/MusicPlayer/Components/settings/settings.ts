import { Component } from '@angular/core';
import { TranslatePipe } from '../../../Shared/Pipes/translate-pipe';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MusicFolderService } from '../../../Services/music-folder-service';

@Component({
  standalone: true,
  selector: 'app-settings',
  providers: [MusicFolderService],
  imports: [TranslatePipe, CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  selectedTheme: string = 'light';
  selectedDownloadFolderPath: string = '';
  selectedMusicFolderPath: string = '';

  constructor(private musicFolderService: MusicFolderService) {}

  ngOnInit() {
    // Initialize the selected paths from the service
    const directoryHandle = this.musicFolderService.getDirectoryHandle();
    if (directoryHandle) {
      this.selectedDownloadFolderPath = directoryHandle.name; // Example, adjust as needed
      this.selectedMusicFolderPath = directoryHandle.name; // Example, adjust as needed
    }
  }

  async selectDownloadFolderPath() {
    await this.musicFolderService.selectFolder(true);
    const directoryHandle = this.musicFolderService.getDirectoryHandle();
    if (directoryHandle) {
      this.selectedDownloadFolderPath = directoryHandle.name; // Example, adjust as needed
    }
  }

  async selectMusicFolderPath() {
    await this.musicFolderService.selectFolder(false);
    const directoryHandle = this.musicFolderService.getDirectoryHandle();
    if (directoryHandle) {
      this.selectedMusicFolderPath = directoryHandle.name; // Example, adjust as needed
    }
  }

  onThemeChange(theme: string) {
    this.selectedTheme = theme;
  }

  onDownloadFolderPathChange(path: string) {
    // Implement the logic to handle the selected download path
    console.log('Download path changed to:', path);
  }

  onMusicFolderPathChange(path: string) {
    // Implement the logic to handle the selected music path
    console.log('Music path changed to:', path);
  }

  onSelectPath() {
    // Implement the logic to open a file dialog and select a path
    console.log('Select Path button clicked');
  }

  onDownloadFolderPathSave() {
    // Implement the logic to save the settings
    console.log('Save button clicked with theme:', this.selectedTheme);
  }

  onMusicFolderPathSave() {
    // Implement the logic to save the settings
    console.log('Save button clicked with theme:', this.selectedTheme);
  }
}
