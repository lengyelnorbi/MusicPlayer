import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MusicFolderService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;

  async selectFolder(read: boolean): Promise<void> {
    try {
      if ('showDirectoryPicker' in window) {
        // File System Access API
        this.directoryHandle = await (window as any).showDirectoryPicker({
        mode: read ? 'read' : 'write'
        });

        console.log('Folder selected:', this.directoryHandle?.name);
      } else {
        // fallback
        console.warn('File System Access API is not supported in this browser. Use Chrome to select a folder or select folder when downloading files.');
      }
    } catch (error) {
      console.error('Folder picker error:', error);
    }
  }

  getDirectoryHandle(): FileSystemDirectoryHandle | null {
    return this.directoryHandle;
  }
}
