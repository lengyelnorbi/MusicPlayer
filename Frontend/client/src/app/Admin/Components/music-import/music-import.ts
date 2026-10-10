
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HubConnection } from '@microsoft/signalr';

import { ImportJob, ImportJobProgress, ImportWorkItem, JobStatus, WorkStatus } from '../../../MusicPlayer/Models/music-import.models-module';
import { MusicImportService } from '../../../Services/music-import-service';
import { MusicImportHubService } from '../../../Services/music-import-hub-service';

@Component({
  selector: 'app-music-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './music-import.html',
  styleUrls: ['./music-import.css']
})
export class MusicImport implements OnInit, OnDestroy {
  url = '';
  job?: ImportJob;
  jobs: ImportJob[] = [];
  loading = false;
  actionLoading = false;
  error = '';

  private hubConnection?: HubConnection;
  private generation = 0;
  private refreshTimer?: ReturnType<typeof setInterval>;
  readonly JobStatus = JobStatus; // Expose JobStatus enum to template
  readonly WorkStatus = WorkStatus; // Expose WorkStatus enum to template

  constructor(
    private readonly importService: MusicImportService,
    private readonly hubService: MusicImportHubService
  ) {}

  ngOnInit(): void {
    void this.refreshJobs();
    this.refreshTimer = setInterval(() => void this.refreshJobs(), 5000);
  }

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
      await this.refreshJobs();
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
      this.upsertJob(this.job);
    } catch (e) {
      console.error('Failed to refresh import job', e);
      this.error = 'Could not refresh import progress.';
    }
  }

  async selectJob(importJob: ImportJob): Promise<void> {
    this.job = importJob;
    this.error = '';
    try {
      await this.connectToJob(importJob.id);
      await this.refreshJob(importJob.id);
    } catch (e) {
      console.error('Failed to select import job', e);
      this.error = 'Could not connect to this import job.';
    }
  }

  async refreshJobs(): Promise<void> {
    try {
      this.jobs = await firstValueFrom(this.importService.getJobs());
      if (this.job) {
        const refreshed = this.jobs.find(item => item.id === this.job?.id);
        if (refreshed) this.job = refreshed;
      }
    } catch (e) {
      console.error('Failed to refresh import jobs', e);
    }
  }

  async retry(job: ImportJob): Promise<void> {
    if (job.status === JobStatus.Processing || job.status === JobStatus.Completed) return;
    this.loading = true;
    this.error = '';
    try {
      const retried = await firstValueFrom(this.importService.retryJob(job.id));
      this.job = retried;
      this.upsertJob(retried);
      await this.connectToJob(retried.id);
    } catch (e) {
      console.error(e);
      this.error = 'Could not restart the import job.';
    } finally {
      this.loading = false;
    }
  }

  async startAll(job: ImportJob = this.job!): Promise<void> {
    if (!job || this.actionLoading || job.status === JobStatus.Completed) return;

    this.actionLoading = true;
    this.error = '';
    try {
      const started = await firstValueFrom(this.importService.startJob(job.id));
      this.job = started;
      this.upsertJob(started);
      await this.connectToJob(started.id);
    } catch (e) {
      console.error(e);
      this.error = 'Could not start the pending tracks.';
    } finally {
      this.actionLoading = false;
    }
  }

  async startItem(item: ImportWorkItem): Promise<void> {
    if (!this.job || item.status !== WorkStatus.Pending || this.actionLoading) return;

    this.actionLoading = true;
    this.error = '';
    try {
      const started = await firstValueFrom(
        this.importService.startWorkItem(this.job.id, item.id)
      );
      this.job = started;
      this.upsertJob(started);
      await this.connectToJob(started.id);
    } catch (e) {
      console.error(e);
      this.error = 'Could not start this track.';
    } finally {
      this.actionLoading = false;
    }
  }

  pendingCount(job: ImportJob): number {
    return job.workItems.filter(item => item.status === WorkStatus.Pending).length;
  }

  progressPercent(job: ImportJob): number {
    if (!job.totalItems) return 0;
    return Math.round(((job.completedItems + job.failedItems) / job.totalItems) * 100);
  }

  statusLabel(status: JobStatus): string {
    return JobStatus[status] ?? 'Unknown';
  }

  workStatusLabel(status: WorkStatus): string {
    return WorkStatus[status] ?? 'Unknown';
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

      // The API finalizes the item after the response completes. Reload both
      // views so the Downloaded state replaces the old Completed snapshot.
      await new Promise(resolve => setTimeout(resolve, 150));
      await this.refreshJob(this.job?.id);
      await this.refreshJobs();
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
    void this.refreshJobs();
  }

  private async connectToJob(jobId: string): Promise<void> {
    await this.disconnectHub();
    const generation = ++this.generation;
    this.hubConnection = await this.hubService.connectToJob(jobId, progress => {
      if (generation === this.generation) this.applyProgress(progress);
    });
  }

  private upsertJob(job: ImportJob): void {
    const index = this.jobs.findIndex(item => item.id === job.id);
    if (index < 0) this.jobs = [job, ...this.jobs];
    else this.jobs = this.jobs.map(item => item.id === job.id ? job : item);
  }

  private async disconnectHub(): Promise<void> {
    const oldConnection = this.hubConnection;
    this.hubConnection = undefined;

    await this.hubService.disconnect(oldConnection);
  }

  ngOnDestroy(): void {
    this.generation++;
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    void this.disconnectHub();
  }
}
