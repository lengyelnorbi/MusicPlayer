import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../../MusicPlayer/Models/user';
import { UserService } from '../../../Services/user-service';
import { TranslatePipe } from '../../../Shared/Pipes/translate-pipe';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserList } from './SubComponents/user-list/user-list';
import { CreateUser } from './SubComponents/create-user/create-user';
import { UpdateUser } from './SubComponents/update-user/update-user';
  

@Component({
  selector: 'app-admin-user',
  standalone: true,
  imports: [CommonModule, MatTableModule, TranslatePipe, UserList, CreateUser, UpdateUser],
  templateUrl: './admin-user.html',
  styleUrl: './admin-user.css',
})
export class AdminUser implements OnInit {
  activeSubTab: 'users' | 'create' | 'update' = 'users';
  selectedUser!: User;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Determine activeTab based on current route
    this.route.url.subscribe(urlSegments => {
      const lastSegment = urlSegments[urlSegments.length - 1]?.path;

      if (lastSegment === 'users') {
        this.activeSubTab = 'users';
      } else if (lastSegment === 'create') {
        this.activeSubTab = 'create';
      } else if (lastSegment === 'update') {
        this.activeSubTab = 'update';
      } else {
        this.activeSubTab = 'users';
      }
    });
  }

  // Listen to updateUserCalledFromUserList events
  onUserUpdateCalled(user: User): void {
    this.selectedUser = user;
    this.activeSubTab = 'update';
  }

  // Listen to activeSubTab changes from AdminNavigation component
  onActiveTabChange(subTab: 'users' | 'create' | 'update'): void {
    this.activeSubTab = subTab;
  }

  // onNavExpandedChange(expanded: boolean): void {
  //   this.isNavExpanded = expanded;
  // }
}
