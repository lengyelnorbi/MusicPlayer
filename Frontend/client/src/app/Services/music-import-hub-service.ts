
import { Injectable } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState
} from '@microsoft/signalr';
import { ImportJobProgress } from '../MusicPlayer/Models/music-import.models-module';
import { ApiConfigService } from './api-config-service';


@Injectable({
  providedIn: 'root'
})
export class MusicImportHubService {

  constructor(private apiConfig: ApiConfigService) {}
  
  async connectToJob(
    jobId: string,
    onProgress: (progress: ImportJobProgress) => void
  ): Promise<HubConnection> {
    const connection: HubConnection =
      new HubConnectionBuilder()
        .withUrl(this.apiConfig.getEndpoint('hubs/music-import'))
        .withAutomaticReconnect()
        .build();

    connection.on('JobProgress', (progress: ImportJobProgress) => {
      onProgress(progress);
    });

    await connection.start();
    await connection.invoke('JoinJob', jobId);

    return connection;
  }

  async disconnect(connection?: HubConnection): Promise<void> {
    if (
      connection &&
      connection.state !== HubConnectionState.Disconnected
    ) {
      await connection.stop();
    }
  }
}