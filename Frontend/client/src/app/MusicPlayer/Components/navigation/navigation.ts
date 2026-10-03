import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LanguageService } from '../../../Services/language-service';
import { TranslationService } from '../../../Services/translation-service';
import { TranslatePipe } from '../../../Shared/Pipes/translate-pipe';
import { GlobalAuthService } from '../../../Services/global-auth-service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css',
})

export class Navigation implements OnInit {
  constructor(
    private globalAuth: GlobalAuthService,
    private router: Router,
    private languageService: LanguageService,
    public translationService: TranslationService
  ) {}

  profileImageUrl: string | null = 'assets/icons/profile.png';
  username: string | null = null;
  isLoggedIn = false;
  currentLanguage: 'en' | 'hu' = 'hu';
  
  isDropdownOpen = false;
  isMobileMenuOpen = false;
  isNavbarHidden = false;
  private lastScrollTop = 0;

  ngOnInit(): void {
    this.isLoggedIn = this.globalAuth.userSourceIsLoggedIn();
    this.username = this.globalAuth.userSourceGetLoggedInUsername();
    console.log('Navigation initialized. Logged in:', this.isLoggedIn, 'Username:', this.username);

    // Subscribe to language changes
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  switchLanguage(lang: 'en' | 'hu') {
    if (lang !== this.currentLanguage) {
      const oldLang = this.currentLanguage;
      this.languageService.setLanguage(lang);
      
      // Construct new URL with new language, replacing the old language in the current URL
      const currentUrl = this.router.url;
      const pathWithoutLang = currentUrl.replace(`/${oldLang}`, '');
      this.router.navigateByUrl(`/${lang}${pathWithoutLang}`);
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
    this.isMobileMenuOpen = false;
  }

  toggleMobileMenu(event: Event) {
    event.stopPropagation();
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', [])
  closeAllMenus() {
    this.isDropdownOpen = false;
    this.isMobileMenuOpen = false;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > this.lastScrollTop && currentScroll > 50) {
      this.isNavbarHidden = true;
      this.isDropdownOpen = false;
      this.isMobileMenuOpen = false;
    } else {
      this.isNavbarHidden = false;
    }
    
    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }

  onSettings() { 
    this.router.navigate([`/${this.currentLanguage}/home/settings`]);
   }
  onLogout() {
    sessionStorage.removeItem('userSourceLoggedInUsername');
    sessionStorage.removeItem('userSourceTokenExpiresAt');
    this.globalAuth.userSourceLogout();
    this.router.navigate([`/${this.currentLanguage}/home/login`]);
  }
}