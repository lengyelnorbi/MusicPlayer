import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { GlobalAuthGuard } from './global-auth-guard';
import { GlobalAuthService } from '../../Services/global-auth-service';

describe('GlobalAuthGuard', () => {
  let guard: GlobalAuthGuard;
  let mockRouter: Partial<Router>;
  let mockGlobalAuthService: Partial<GlobalAuthService>;

  beforeEach(() => {
    mockRouter = {
      navigate: vi.fn(),
    };
    mockGlobalAuthService = {
      userSourceIsLoggedIn: vi.fn(),
      adminSourceIsLoggedIn: vi.fn(),
      isUserSourceTokenExpired: vi.fn(),
      isAdminSourceTokenExpired: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        GlobalAuthGuard,
        { provide: Router, useValue: mockRouter },
        { provide: GlobalAuthService, useValue: mockGlobalAuthService },
      ],
    });

    guard = TestBed.inject(GlobalAuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
