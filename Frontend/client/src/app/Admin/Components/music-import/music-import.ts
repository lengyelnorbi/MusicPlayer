
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HubConnection } from '@microsoft/signalr';

import { ImportJob, ImportJobProgress, ImportWorkItem, JobStatus, WorkStatus, MusicRequestStatus, MusicUploadRequest } from '../../../MusicPlayer/Models/music-import.models-module';
import { MusicImportService } from '../../../Services/music-import-service';
import { MusicImportHubService } from '../../../Services/music-import-hub-service';
import { MusicUploadRequestService } from '../../../Services/music-upload-request-service';
import { AdminService } from '../../../Services/admin-service';

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
  uploadRequests: MusicUploadRequest[] = [];
  trackFilter: 'all' | 'pending' | 'downloadable' | 'failed' = 'all';
  syncingDrive = false;
  driveSyncMessage = '';

  private hubConnection?: HubConnection;
  private generation = 0;
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private refreshInFlight = false;
  private destroyed = false;
  private readonly refreshIntervalMs = 5000;
  readonly JobStatus = JobStatus; // Expose JobStatus enum to template
  readonly WorkStatus = WorkStatus; // Expose WorkStatus enum to template
  readonly MusicRequestStatus = MusicRequestStatus;

  constructor(
    private readonly importService: MusicImportService,
    private readonly hubService: MusicImportHubService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly uploadRequestService: MusicUploadRequestService,
    private readonly adminService: AdminService
  ) {}

  async syncMusicFromGoogleDrive(): Promise<void> {
    if (this.syncingDrive) return;

    this.syncingDrive = true;
    this.driveSyncMessage = 'Checking Google Drive for new music...';
    try {
      const result = await this.adminService.syncMusicFromGoogleDrive();
      this.driveSyncMessage = result.addedCount === 0
        ? `Sync complete. No new music found (${result.driveFileCount} Drive files checked).`
        : `Sync complete. Added ${result.addedCount} new music record${result.addedCount === 1 ? '' : 's'} from ${result.driveFileCount} Drive files.`;
    } catch (error) {
      console.error('Google Drive music sync failed:', error);
      this.driveSyncMessage = 'Sync failed. Check the API logs and try again.';
    } finally {
      this.syncingDrive = false;
      this.refreshView();
    }
  }

  ngOnInit(): void {
    void this.refreshJobs();
    void this.refreshUploadRequests();
    this.scheduleRefresh();
  }

  async refreshUploadRequests(): Promise<void> {
    try {
      this.uploadRequests = await firstValueFrom(this.uploadRequestService.pending());
      this.refreshView();
    } catch (e) {
      console.error('Failed to refresh music upload requests', e);
    }
  }

  async importUploadRequest(request: MusicUploadRequest): Promise<void> {
    if (this.actionLoading) return;
    this.actionLoading = true;
    this.error = '';
    try {
      await firstValueFrom(this.uploadRequestService.importRequest(request.id));
      this.uploadRequests = this.uploadRequests.filter(item => item.id !== request.id);
      await this.refreshJobs();
    } catch (e) {
      console.error('Failed to import requested music', e);
      this.error = 'Could not create an import job from this request.';
    } finally {
      this.actionLoading = false;
      this.refreshView();
    }
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
      const apiMessage = (e as { error?: { message?: string } })?.error?.message;
      this.error = apiMessage ||
        'Could not start or load the import. Check the API and SignalR connection.';
    } finally {
      if (generation === this.generation) {
        this.loading = false;
        this.refreshView();
      }
    }
  }

  async refreshJob(jobId?: string): Promise<void> {
    const id = jobId ?? this.job?.id;
    if (!id || this.refreshInFlight) return;

    this.refreshInFlight = true;
    try {
      this.job = await firstValueFrom(
        this.importService.getJob(id)
      );
      this.upsertJob(this.job);
    } catch (e) {
      console.error('Failed to refresh import job', e);
      this.error = 'Could not refresh import progress.';
    } finally {
      this.refreshInFlight = false;
      this.refreshView();
    }
  }

  async selectJob(importJob: ImportJob): Promise<void> {
    this.job = importJob;
    this.error = '';
    this.refreshView();
    try {
      await this.connectToJob(importJob.id);
      await this.refreshJob(importJob.id);
    } catch (e) {
      console.error('Failed to select import job', e);
      this.error = 'Could not connect to this import job.';
    }
  }

  async refreshJobs(): Promise<void> {
    if (this.refreshInFlight) return;

    this.refreshInFlight = true;
    try {
      const selectedJobId = this.job?.id;
      this.jobs = await firstValueFrom(this.importService.getJobs());

      // Refresh the selected job too: the list endpoint does not include its
      // work-item details.
      if (selectedJobId) {
        this.job = await firstValueFrom(
          this.importService.getJob(selectedJobId)
        );
        this.upsertJob(this.job);
      }
    } catch (e) {
      console.error('Failed to refresh import jobs', e);
    } finally {
      this.refreshInFlight = false;
      this.refreshView();
    }
  }

  async retry(job: ImportJob): Promise<void> {
    if (job.status === JobStatus.Completed) return;
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
      this.refreshView();
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
      this.refreshView();
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
      this.refreshView();
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

  workTitle(item: ImportWorkItem): string {
    if (item.title?.trim()) return item.title;

    const error = item.error?.toLowerCase() ?? '';
    if (error.includes('age-restricted') || error.includes('confirm your age')) {
      return 'Age-restricted video';
    }
    if (error.includes('private')) return 'Private video';
    if (
      error.includes('unavailable') ||
      error.includes('copyright') ||
      error.includes('removed') ||
      error.includes('not available')
    ) {
      return 'Unavailable video';
    }

    return 'Title unavailable';
  }

  filteredWorkItems(job: ImportJob): ImportWorkItem[] {
    switch (this.trackFilter) {
      case 'pending': return job.workItems.filter(item => item.status === WorkStatus.Pending || item.status === WorkStatus.Processing);
      case 'downloadable': return job.workItems.filter(item => item.status === WorkStatus.Completed);
      case 'failed': return job.workItems.filter(item => item.status === WorkStatus.Failed);
      default: return job.workItems;
    }
  }

  setTrackFilter(filter: string): void {
    if (filter === 'pending' || filter === 'downloadable' || filter === 'failed') {
      this.trackFilter = filter;
    } else {
      this.trackFilter = 'all';
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

  async copyUrl(item: ImportWorkItem): Promise<void> {
    if (!item.url) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(item.url);
      } else {
        const input = document.createElement('textarea');
        input.value = item.url;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      this.error = '';
    } catch (e) {
      console.error(e);
      this.error = 'Could not copy the video URL.';
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
    this.refreshView();

    // Refresh both the queue and selected work-item details.
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

  async deleteJob(job: ImportJob): Promise<void> {
    if (this.actionLoading || !window.confirm('Delete this import job and all its tracks?')) return;

    this.actionLoading = true;
    this.error = '';
    try {
      await firstValueFrom(this.importService.deleteJob(job.id));
      this.jobs = this.jobs.filter(item => item.id !== job.id);
      if (this.job?.id === job.id) {
        await this.disconnectHub();
        this.job = undefined;
      }
    } catch (e) {
      console.error(e);
      this.error = 'Could not delete the import job.';
    } finally {
      this.actionLoading = false;
      this.refreshView();
    }
  }

  async deleteWorkItem(item: ImportWorkItem): Promise<void> {
    if (!this.job || this.actionLoading ||
        !window.confirm(`Delete ${item.title || 'this track'} from the import?`)) return;

    const jobId = this.job.id;
    this.actionLoading = true;
    this.error = '';
    try {
      await firstValueFrom(this.importService.deleteWorkItem(jobId, item.id));
      this.job = {
        ...this.job,
        totalItems: Math.max(0, this.job.totalItems - 1),
        workItems: this.job.workItems.filter(workItem => workItem.id !== item.id)
      };
      this.upsertJob(this.job);
    } catch (e) {
      console.error(e);
      this.error = 'Could not delete this track.';
    } finally {
      this.actionLoading = false;
      this.refreshView();
    }
  }

  private async disconnectHub(): Promise<void> {
    const oldConnection = this.hubConnection;
    this.hubConnection = undefined;

    await this.hubService.disconnect(oldConnection);
  }

  private scheduleRefresh(): void {
    if (this.destroyed) return;

    this.refreshTimer = setTimeout(async () => {
      await this.refreshJobs();
      await this.refreshUploadRequests();
      this.scheduleRefresh();
    }, this.refreshIntervalMs);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.generation++;
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    void this.disconnectHub();
  }

  private refreshView(): void {
    if (!this.destroyed) this.changeDetectorRef.detectChanges();
  }
}
