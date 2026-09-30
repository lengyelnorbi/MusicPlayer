import { Injectable } from '@angular/core';
import { ApiConfigService } from './api-config-service';
import { response } from 'express';
import { Music } from '../MusicPlayer/Models/music';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private apiConfigService: ApiConfigService) {}

  async createUser(username: string, email: string, password: string, role: 'User' | 'Admin'): Promise<void> {
    try {
      const endpoint = this.apiConfigService.getEndpoint('/api/user');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, email, passwordHash: password, role}),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      console.log('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      console.error('Failed to create user. Please try again.');
    }
  }

  uploadMusic(link: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const endpoint = this.apiConfigService.getEndpoint('/api/fileupload');
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(link),
        });

        if (!response.ok) {
          throw new Error('Failed to upload music');
        }

        console.log('Music uploaded successfully!');
        resolve();
      } catch (error) {
        console.error('Error uploading music:', error);
        console.error('Failed to upload music. Please try again.');
        reject(error);
      }
    });
  }

  async downloadAllMusic(): Promise<void> {
    try {
      const endpoint = this.apiConfigService.getEndpoint('/api/music/download-all');
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download all music');
      }

      try {
      if(response.ok) {
        const data = await response.json();
        console.log('Received data for all music download:', data);
        data.forEach(async (musicID: number) => {
          try{
            await this.downloadMusic(musicID);
          }
          catch (error) {
            console.error(`Error downloading music with ID ${musicID}:`, error);
          }

        });
        console.log('All music data:', data);
      }
      }
      catch (error) {
        console.error('Error parsing JSON:', error);
      }
    }
    catch (error) {
      console.error('Error downloading all music:', error);
      console.error('Failed to download all music. Please try again.');
    }
  }

  async downloadMusic(musicID: number): Promise<void> {
    const endpoint = this.apiConfigService.getEndpoint(
      `/api/music/${musicID}/download`
    );

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();

      // Get the filename from Content-Disposition
      const contentDisposition = response.headers.get(
        'Content-Disposition'
      );

      let filename = `music_${musicID}`;

      if (contentDisposition) {
        const match = contentDisposition.match(
          /filename\*=(?:UTF-8'')?([^;]+)|filename="?([^";]+)"?/i
        );

        if (match) {
          filename = decodeURIComponent(
            (match[1] ?? match[2]).trim()
          );
        }
      }
    console.log(
      'Content-Disposition:',
      response.headers.get('Content-Disposition')
    );

    console.log(
      'Content-Type:',
      response.headers.get('Content-Type')
    );
      console.log('Filename:', filename);
      console.log('MIME type:', blob.type);

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  }

  async updateUser(user : { id: number, email: string, username: string, password?: string | null }): Promise<void> {
    try {
      const endpoint = this.apiConfigService.getEndpoint('/api/user');
      const pwd = user.password ? user.password : null;
      console.log('Updating user with data:', { id: user.id, email: user.email, username: user.username, password: pwd });
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: user.id, email: user.email, username: user.username, password: pwd }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      console.log('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      console.error('Failed to update user. Please try again.');
    }
  }

  async generatePassword(): Promise<{ password: string; success: boolean }> {
    try {
      const endpoint = this.apiConfigService.getEndpoint('/api/password/generate-password');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to generate password');
      }

      const data = await response.json();
      
      const generatedPassword = data.password;

      return { password: generatedPassword, success: true };

    } catch (error) {
      console.error('Error generating password:', error);
      console.error('Failed to generate password. Please try again.');
      return { password: '', success: false };
    } finally {
    }
  }
}
