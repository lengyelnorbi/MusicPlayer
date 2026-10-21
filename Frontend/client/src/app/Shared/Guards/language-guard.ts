import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { LanguageService } from '../../Services/language-service';

@Injectable({
  providedIn: 'root',
})
export class LanguageGuard implements CanActivate {
  constructor(private languageService: LanguageService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const lang = route.paramMap.get('lang');

    // If no language in URL, redirect to default language
    if (!lang) {
      const defaultLang = this.languageService.getCurrentLanguage();
      // Reconstruct the URL with language parameter
      const urlSegments = state.url.split('?');
      const basePath = urlSegments[0];
      const queryParams = urlSegments[1] ? '?' + urlSegments[1] : '';
      
      this.router.navigateByUrl(`/${defaultLang}${basePath}${queryParams}`);
      return false;
    }

    // If language is provided but not supported, redirect to default
    if (!this.languageService.isSupportedLanguage(lang)) {
      const defaultLang = this.languageService.getCurrentLanguage();
      const urlSegments = state.url.split('?');
      const basePath = urlSegments[0].replace(`/${lang}`, '');
      const queryParams = urlSegments[1] ? '?' + urlSegments[1] : '';
      
      this.router.navigateByUrl(`/${defaultLang}${basePath}${queryParams}`);
      return false;
    }

    // Update language service with URL language
    this.languageService.getLanguageFromUrl(lang);
    return true;
  }
}
