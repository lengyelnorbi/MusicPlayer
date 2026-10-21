import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { LanguageGuard } from './language-guard';
import { LanguageService } from '../../Services/language-service';

describe('LanguageGuard', () => {
  let guard: LanguageGuard;
  let mockRouter: Partial<Router>;
  let mockLanguageService: Partial<LanguageService>;

  beforeEach(() => {
    mockRouter = {
      navigateByUrl: vi.fn(),
    };
    mockLanguageService = {
      getCurrentLanguage: vi.fn(),
      isSupportedLanguage: vi.fn((lang: string): lang is any => true) as any,
    };

    TestBed.configureTestingModule({
      providers: [
        LanguageGuard,
        { provide: Router, useValue: mockRouter },
        { provide: LanguageService, useValue: mockLanguageService },
      ],
    });

    guard = TestBed.inject(LanguageGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
