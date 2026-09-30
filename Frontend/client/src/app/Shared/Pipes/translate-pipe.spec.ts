import { vi } from 'vitest';
import { TranslatePipe } from './translate-pipe';
import { TranslationService } from '../../Services/translation-service';

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;
  let mockTranslationService: Partial<TranslationService>;

  beforeEach(() => {
    mockTranslationService = {
      get: vi.fn(),
    };
  });

  it('should create an instance', () => {
    pipe = new TranslatePipe(mockTranslationService as TranslationService);
    expect(pipe).toBeTruthy();
  });
});
