import { TestBed } from '@angular/core/testing';

import { MusicImportService } from './music-import-service';

describe('MusicImportService', () => {
  let service: MusicImportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MusicImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
