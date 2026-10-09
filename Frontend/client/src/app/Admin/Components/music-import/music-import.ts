
import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { HubConnection } from '@microsoft/signalr';

import { ImportJob, ImportJobProgress, ImportWorkItem, JobStatus, WorkStatus } from '../../../MusicPlayer/Models/music-import.models-module';
import { MusicImportService } from '../../../Services/music-import-service';
import { MusicImportHubService } from '../../../Services/music-import-hub-service';

@Component({
  selector: 'app-music-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './music-import.html'
})
export class MusicImport implements OnDestroy {
  url = '';
  job?: ImportJob;
  loading = false;
  error = '';

  private hubConnection?: HubConnection;
  private generation = 0;
  readonly JobStatus = JobStatus; // Expose JobStatus enum to template
  readonly WorkStatus = WorkStatus; // Expose WorkStatus enum to template

  constructor(
    private readonly importService: MusicImportService,
    private readonly hubService: MusicImportHubService
  ) {}

  async createImport(): Promise<void> {
    if (!this.url.trim() || this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.job = undefined;

    await this.disconnectHub();
    const generation = ++this.generation;

    try {
      const created = await firstValueFrom(
        this.importService.createJob(this.url.trim())
      );

      if (generation !== this.generation) return;

      // Start listening before loading the latest job snapshot.
      this.hubConnection = await this.hubService.connectToJob(
        created.jobId,
        progress => {
          if (generation === this.generation) {
            this.applyProgress(progress);
          }
        }
      );

      if (generation !== this.generation) {
        await this.disconnectHub();
        return;
      }

      await this.refreshJob(created.jobId);
    } catch (e) {
      console.error(e);
      this.error =
        'Could not start or load the import. Check the API and SignalR connection.';
    } finally {
      if (generation === this.generation) {
        this.loading = false;
      }
    }
  }

  async refreshJob(jobId?: string): Promise<void> {
    const id = jobId ?? this.job?.id;
    if (!id) return;

    try {
      this.job = await firstValueFrom(
        this.importService.getJob(id)
      );
    } catch (e) {
      console.error('Failed to refresh import job', e);
      this.error = 'Could not refresh import progress.';
    }
  }

  async download(item: ImportWorkItem): Promise<void> {
    if (item.status !== WorkStatus.Completed) return;

    try {
      const blob = await firstValueFrom(
        this.importService.downloadWorkItem(item.id)
      );

      this.importService.saveDownloadedFile(
        blob,
        item.fileName || `${item.title || 'music'}.m4a`
      );
    } catch (e) {
      console.error(e);
      this.error = `Could not download ${item.title || 'this file'}.`;
    }
  }


  async downloadAll(): Promise<void> {
    if (!this.job) return;

    const completedItems = this.job.workItems.filter(
      item => item.status === WorkStatus.Completed
    );

    for (const item of completedItems) {
      await this.download(item);
    }
  }

  private applyProgress(progress: ImportJobProgress): void {
    if (!this.job || this.job.id !== progress.jobId) return;

    this.job = {
      ...this.job,
      status: progress.status,
      totalItems: progress.totalItems,
      completedItems: progress.completedItems,
      failedItems: progress.failedItems
    };

    // Refresh the full job to retrieve updated work-item statuses.
    void this.refreshJob(progress.jobId);
  }

  private async disconnectHub(): Promise<void> {
    const oldConnection = this.hubConnection;
    this.hubConnection = undefined;

    await this.hubService.disconnect(oldConnection);
  }

  ngOnDestroy(): void {
    this.generation++;
    void this.disconnectHub();
  }
}