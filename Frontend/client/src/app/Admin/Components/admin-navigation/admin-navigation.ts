import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, signal, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalAuthService } from '../../../Services/global-auth-service';

@Component({
  selector: 'app-admin-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-navigation.html',
  styleUrl: './admin-navigation.css',
})
export class AdminNavigation implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private globalAuthService: GlobalAuthService,
  ) {}

  // Output event for parent to listen to activeTab changes
  @Output() activeTabChange = new EventEmitter<'dashboard' | 'music' | 'user' | 'token' | 'settings'>();
  @Output() navExpandedChange = new EventEmitter<boolean>();

  // State signals for reactive UI updates
  isNavExpanded = signal(true);
  isMobileMenuOpen = signal(false);
  activeTab = signal<'dashboard' | 'music' | 'user' | 'token' | 'settings'>('dashboard');
  username = signal<string | null>(null);
  isLoggedIn = signal(false);

  // Navigation items with icons
  navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'M3 12l2-12h14l2 12M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7',
      route: '/admin/dashboard'
    },
    {
      id: 'music',
      label: 'Music',
      icon: 'M9 19V6l12-3v13a2 2 0 11-4 0V8l-8 2v5a2 2 0 11-4 0z',
      route: '/admin/music'
    },
    {
      id: 'user',
      label: 'Users',
      icon: 'M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M9 9H3v2a6 6 0 0012 0v-2H9z',
      route: '/admin/user'
    },
    {
      id: 'token',
      label: 'Tokens',
      icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
      route: '/admin/token'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      route: '/admin/settings'
    }
  ];

  ngOnInit(): void {
    console.log('AdminNavigation: ngOnInit called');
    this.isLoggedIn.set(this.globalAuthService.adminSourceIsLoggedIn());
    this.username.set(this.globalAuthService.adminSourceGetLoggedInUsername());

    // Restore navigation state from localStorage
    const savedNavState = localStorage.getItem('adminNavExpanded');
    if (savedNavState !== null) {
      this.isNavExpanded.set(JSON.parse(savedNavState));
      this.navExpandedChange.emit(this.isNavExpanded());
    }

    // Sync activeTab with current route
    this.route.url.subscribe(urlSegments => {
      const lastSegment = urlSegments[urlSegments.length - 1]?.path;
      let newTab: 'dashboard' | 'music' | 'user' | 'token' | 'settings' = 'dashboard';
      
      if (lastSegment === 'dashboard' || lastSegment === 'admin') {
        newTab = 'dashboard';
      } else if (lastSegment === 'music') {
        newTab = 'music';
      } else if (lastSegment === 'user') {
        newTab = 'user';
      } else if (lastSegment === 'token') {
        newTab = 'token';
      } else if (lastSegment === 'settings') {
        newTab = 'settings';
      }
      
      this.activeTab.set(newTab);
      this.activeTabChange.emit(newTab);
    });
  }

  toggleNavigation(): void {
    this.isNavExpanded.update(val => !val);
    localStorage.setItem('adminNavExpanded', JSON.stringify(this.isNavExpanded()));
    this.navExpandedChange.emit(this.isNavExpanded());
    this.isMobileMenuOpen.set(false);
  }

  toggleMobileMenu(event: Event): void {
    event.stopPropagation();
    this.isMobileMenuOpen.update(val => !val);
  }

  navigateTo(item: typeof this.navItems[0]): void {
    const newTab = item.id as 'dashboard' | 'music' | 'user' | 'token' | 'settings';
    this.activeTab.set(newTab);
    this.activeTabChange.emit(newTab);
    this.router.navigate([item.route]);
    this.isMobileMenuOpen.set(false);
  }

  async onLogout(): Promise<void> {
    console.log('AdminNavigation: Logging out');
    await this.globalAuthService.adminSourceLogout();
    this.router.navigate(['/admin/login']);
  }

  @HostListener('document:click', [])
  closeMenuOnClickOutside(): void {
    this.isMobileMenuOpen.set(false);
  }

  @HostListener('window:resize', [])
  closeMenuOnResize(): void {
    // Close mobile menu when resizing to desktop
    if (window.innerWidth >= 768) {
      this.isMobileMenuOpen.set(false);
    }
  }
}
