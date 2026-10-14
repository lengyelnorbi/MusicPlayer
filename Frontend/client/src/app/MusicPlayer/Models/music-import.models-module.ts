export enum JobStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  CompletedWithErrors = 3,
  Failed = 4,
  Paused = 5
}

export enum WorkStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  Failed = 3,
  Downloaded = 4
}

export enum MusicRequestStatus {
  Pending = 0,
  Imported = 1,
  Rejected = 2
}

export interface CreateImportJobRequest {
url: string;
}

export interface CreateMusicImportResponse {
jobId: string;
status: JobStatus;
}

export interface ImportWorkItem {
id: string;
url: string;
title?: string | null;
status: WorkStatus;
fileName?: string | null;
error?: string | null;
}

export interface ImportJob {
id: string;
sourceUrl: string;
status: JobStatus;
totalItems: number;
completedItems: number;
failedItems: number;
  workItems: ImportWorkItem[];
  error?: string | null;
}

export interface ImportJobProgress {
jobId: string;
status: JobStatus;
totalItems: number;
completedItems: number;
failedItems: number;
}

export interface MusicUploadRequest {
  id: string;
  userId: number;
  username?: string | null;
  url: string;
  status: MusicRequestStatus;
  createdAt: string;
  processedAt?: string | null;
  importJobId?: string | null;
  adminNote?: string | null;
}
