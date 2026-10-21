import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { LanguageService } from '../../../Services/language-service';
import { TranslationService } from '../../../Services/translation-service';
import { TranslatePipe } from '../../../Shared/Pipes/translate-pipe';
import { GlobalAuthService } from '../../../Services/global-auth-service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Subscription } from 'rxjs/internal/Subscription';
import { filter } from 'rxjs/internal/operators/filter';

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
  isLoggedIn: boolean = false;
  currentLanguage: 'en' | 'hu' = 'hu';
  private sub = new Subscription();
  
  isDropdownOpen = false;
  isMobileMenuOpen = false;
  isNavbarHidden = false;
  private lastScrollTop = 0;

  private syncAuthState(): void {
    this.isLoggedIn = this.globalAuth.userSourceIsLoggedIn();
    this.username = this.globalAuth.userSourceGetLoggedInUsername();
  }

  ngOnInit(): void {
    this.syncAuthState();
    console.log('Navigation initialized. Logged in:', this.isLoggedIn, 'Username:', this.username);

    this.sub.add(
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.syncAuthState())
  );
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
    this.username = '';
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}