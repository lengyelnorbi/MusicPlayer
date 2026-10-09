export enum JobStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  Failed = 3
}

export enum WorkStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  Failed = 3
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
title?: string | null;
status: WorkStatus;
fileName?: string | null;
error?: string | null;
}

export interface ImportJob {
id: string;
status: JobStatus;
totalItems: number;
completedItems: number;
failedItems: number;
workItems: ImportWorkItem[];
}

export interface ImportJobProgress {
jobId: string;
status: JobStatus;
totalItems: number;
completedItems: number;
failedItems: number;
}
