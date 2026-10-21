import { TestBed } from '@angular/core/testing';

import { MusicImportHubService } from './music-import-hub-service';

describe('MusicImportHubService', () => {
  let service: MusicImportHubService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MusicImportHubService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
