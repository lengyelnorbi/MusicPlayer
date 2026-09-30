import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LanguageService } from './language-service';
import { translations } from '../i18n';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private currentTranslations$ = new BehaviorSubject<Record<string, any>>(
    translations['hu']
  );

  public translations$ = this.currentTranslations$.asObservable();

  constructor(private languageService: LanguageService) {
    // Subscribe to language changes and update translations
    this.languageService.currentLanguage$.subscribe((lang) => {
      if (translations[lang]) {
        this.currentTranslations$.next(translations[lang]);
      }
    });
  }

  /**
   * Get a translated string by key
   * @param key - The translation key (e.g., 'nav.music')
   * @returns The translated string or the key if not found
   */
  public get(key: string): string {
    const keys = key.split('.');
    let value: any = this.currentTranslations$.value;

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  }

  /**
   * Get translations object as observable
   */
  public getTranslations(): Observable<Record<string, any>> {
    return this.translations$;
  }

  /**
   * Get current translations snapshot
   */
  public getCurrentTranslations(): Record<string, any> {
    return this.currentTranslations$.value;
  }
}
