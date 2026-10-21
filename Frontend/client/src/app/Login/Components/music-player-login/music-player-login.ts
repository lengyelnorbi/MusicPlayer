import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../Shared/Pipes/translate-pipe';
import { GlobalAuthService } from '../../../Services/global-auth-service';

@Component({
  selector: 'app-music-player-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './music-player-login.html',
  styleUrl: './music-player-login.css',
  encapsulation: ViewEncapsulation.None
})
export class MusicPlayerLogin implements OnInit, OnDestroy {
  emailLabel: string = 'Email';
  passwordLabel: string = 'Password'
  loginForm = new FormGroup({
      email: new FormControl(''),
      password: new FormControl(''),
    });
  
  showPassword: boolean = false;

  constructor(private globalAuth: GlobalAuthService, private router: Router) {
  }

  ngOnInit(): void {
  }

  async login(username?: string | null, password?: string | null): Promise<void> {
    if (this.globalAuth.userSourceIsLoggedIn()) {
      this.router.navigate(['/home/music-player']);
      return;
    }
    username = this.loginForm.value.email; // Replace with actual input retrieval logic
    password = this.loginForm.value.password; // Replace with actual input retrieval logic
    if(!username || !password) {
      // Handle missing credentials, e.g., show an error message
      return;
    }
    await this.globalAuth.userSourceLogin(username, password);
    if (this.globalAuth.userSourceIsLoggedIn()) {
      // Handle successful login, e.g., navigate to the main page
      this.router.navigate(['/home/music-player']);
    } else {
      // Handle failed login, e.g., show an error message
    }
  }

  ngOnDestroy(): void {
    // Don't logout here - component destruction doesn't mean logout
  }
}