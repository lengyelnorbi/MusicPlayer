import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../Shared/Pipes/translate-pipe';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalAuthService } from '../../../Services/global-auth-service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLogin {
  emailLabel: string = 'Email';
  passwordLabel: string = 'Password'
  loginForm = new FormGroup({
      email: new FormControl(''),
      password: new FormControl(''),
    });
  
  showPassword: boolean = false;

  constructor(private globalAuth: GlobalAuthService, private router: Router) {
    console.trace('AdminLogin component constructor called');
  }


  ngOnInit(): void {
    console.trace('AdminLogin component ngOnInit called');
  }

  async login(username?: string | null, password?: string | null): Promise<void> {
    if (this.globalAuth.adminSourceIsLoggedIn()) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }
    username = this.loginForm.value.email; // Replace with actual input retrieval logic
    password = this.loginForm.value.password; // Replace with actual input retrieval logic
    if(!username || !password) {
      // Handle missing credentials, e.g., show an error message
      return;
    }
    await this.globalAuth.adminSourceLogin(username, password);
    if (this.globalAuth.adminSourceIsLoggedIn()) {
      // Handle successful login, e.g., navigate to the main page
      this.router.navigate(['/admin/dashboard']);
    } else {
      // Handle failed login, e.g., show an error message
    }
  }
}
