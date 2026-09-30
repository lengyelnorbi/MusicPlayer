import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { LoginRedirectGuard } from './login-redirect-guard';
import { GlobalAuthService } from '../../Services/global-auth-service';

describe('LoginRedirectGuard', () => {
  let guard: LoginRedirectGuard;
  let mockRouter: Partial<Router>;
  let mockGlobalAuthService: Partial<GlobalAuthService>;

  beforeEach(() => {
    mockRouter = {
      navigate: vi.fn(),
    };
    mockGlobalAuthService = {
      userSourceIsLoggedIn: vi.fn(),
      adminSourceIsLoggedIn: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LoginRedirectGuard,
        { provide: Router, useValue: mockRouter },
        { provide: GlobalAuthService, useValue: mockGlobalAuthService },
      ],
    });

    guard = TestBed.inject(LoginRedirectGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
