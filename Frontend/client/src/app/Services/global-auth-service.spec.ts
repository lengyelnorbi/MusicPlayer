import { TestBed } from '@angular/core/testing';

import { GlobalAuthService } from './global-auth-service';

describe('GlobalAuthService', () => {
  let service: GlobalAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlobalAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});