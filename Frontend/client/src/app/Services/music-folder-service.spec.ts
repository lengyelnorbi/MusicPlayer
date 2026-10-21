import { TestBed } from '@angular/core/testing';

import { MusicFolderService } from './music-folder-service';

describe('MusicFolderService', () => {
  let service: MusicFolderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MusicFolderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
