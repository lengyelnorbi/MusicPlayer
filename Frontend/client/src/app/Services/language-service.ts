import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

type Language = 'en' | 'hu';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly STORAGE_KEY = 'preferredLanguage';
  private readonly SUPPORTED_LANGUAGES: Language[] = ['en', 'hu'];
  private readonly DEFAULT_LANGUAGE: Language = 'hu';

  private currentLanguageSubject = new BehaviorSubject<Language>(this.getInitialLanguage());
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor() {
    console.log('LanguageService initialized with language:', this.currentLanguageSubject.value);
  }

  /**
   * Get the current language
   */
  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  /**
   * Set the language and save to localStorage
   */
  setLanguage(lang: Language): void {
    if (this.isSupportedLanguage(lang)) {
      this.currentLanguageSubject.next(lang);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, lang);
      }
      console.log('Language changed to:', lang);
    } else {
      console.warn('Language not supported:', lang);
    }
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): Language[] {
    return this.SUPPORTED_LANGUAGES;
  }

  /**
   * Check if a language is supported
   */
  isSupportedLanguage(lang: string): lang is Language {
    return this.SUPPORTED_LANGUAGES.includes(lang as Language);
  }

  /**
   * Get language from different sources (URL > localStorage > browser > default)
   */
  private getInitialLanguage(): Language {
    // 1. Check localStorage
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && this.isSupportedLanguage(saved)) {
        return saved;
      }
    }

    // 2. Check browser language
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0];
      if (this.isSupportedLanguage(browserLang)) {
        return browserLang;
      }
    }

    // 3. Fallback to default
    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Get language from URL parameter
   */
  getLanguageFromUrl(urlLang: string): Language {
    if (this.isSupportedLanguage(urlLang)) {
      this.setLanguage(urlLang);
      return urlLang;
    }
    return this.getCurrentLanguage();
  }
}
