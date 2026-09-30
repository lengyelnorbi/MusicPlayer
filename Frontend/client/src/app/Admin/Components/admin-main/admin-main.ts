import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminNavigation } from '../admin-navigation/admin-navigation';
import { AdminMusic } from '../admin-music/admin-music';
import { AdminUser } from '../admin-user/admin-user';
import { Dashboard } from '../dashboard/dashboard';
import { Token } from '../token/token';

@Component({
  selector: 'app-admin-main',
  standalone: true,
  imports: [CommonModule, AdminNavigation, AdminMusic, AdminUser, Dashboard, Token],
  templateUrl: './admin-main.html',
  styleUrl: './admin-main.css',
})
export class AdminMain implements OnInit {
  activeTab: 'dashboard' | 'music' | 'user' | 'token' | 'settings' = 'dashboard';
  isNavExpanded: boolean = true;

  @ViewChild(AdminNavigation) adminNavigation!: AdminNavigation;

  constructor(private route: ActivatedRoute) {
    console.log('AdminMain constructor called');
  }

  ngOnInit(): void {
    // Determine activeTab based on current route
    this.route.url.subscribe(urlSegments => {
      const lastSegment = urlSegments[urlSegments.length - 1]?.path;
      console.log('Current URL segments:', urlSegments);
      console.log('Last URL segment:', lastSegment);
      if (lastSegment === 'music') {
        this.activeTab = 'music';
      } else if (lastSegment === 'user') {
        this.activeTab = 'user';
      } else if (lastSegment === 'token') {
        this.activeTab = 'token';
      } else if (lastSegment === 'settings') {
        this.activeTab = 'settings';
      } else {
        // Default to dashboard
        this.activeTab = 'dashboard';
      }
    });
  }

  // Listen to activeTab changes from AdminNavigation component
  onActiveTabChange(tab: 'dashboard' | 'music' | 'user' | 'token' | 'settings'): void {
    this.activeTab = tab;
  }

  onNavExpandedChange(expanded: boolean): void {
    this.isNavExpanded = expanded;
  }
}
