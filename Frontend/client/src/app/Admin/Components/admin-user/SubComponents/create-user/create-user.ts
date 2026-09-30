import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../../Services/admin-service';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-user.html',
  styleUrl: './create-user.css',
})
export class CreateUser implements OnInit {
  email: string = '';
  username: string = '';
  role: string = 'User'; // Default role
  generatedPassword: string | null = null;
  isLoading: boolean = false;
  isCopySuccess: boolean = false;

  createUserForm = new FormGroup({
    email: new FormControl(''),
    username: new FormControl({ value: '', disabled: true }),
    role: new FormControl('User'),
    password: new FormControl({ value: '', disabled: true })
  });

  roles = [
    { value: 'User', label: 'User' },
    { value: 'Admin', label: 'Admin' }
  ];

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  async generatePassword(): Promise<void> {
    // Only reset copy success message on regeneration
    this.isCopySuccess = false;
    
    // Set loading state to prevent double-clicks
    this.isLoading = true;
    
    try {
      const result = await this.adminService.generatePassword();
      
      if (result.success && result.password) {
        console.log('Generated password:', result.password);
        
        // Update form controls with new password - UI stays visible!
        this.generatedPassword = result.password;
        this.createUserForm.get('password')?.setValue(result.password);
        this.createUserForm.get('username')?.enable();
        this.createUserForm.get('password')?.enable();
        
        console.log('Form controls enabled after password generation');
        
        // Trigger change detection to update UI immediately
        this.isLoading = false;
        this.cdr.detectChanges();
      } else {
        console.error('Failed to generate password. Please try again.');
        this.isLoading = false;
      }
    } catch (error) {
      console.error('Error generating password:', error);
      console.error('Failed to generate password. Please try again.');
      this.isLoading = false;
    }
  }

  onEmailChange(): void {
    this.email = this.createUserForm.get('email')?.value || '';
    
    // Only process if email contains @
    if (this.email.includes('@')) {
      // Reset username and password when email changes
      this.username = '';
      this.generatedPassword = null;
      this.isCopySuccess = false;
      
      // Clear form controls
      this.createUserForm.get('username')?.setValue('');
      this.createUserForm.get('password')?.setValue('');
      this.createUserForm.get('username')?.disable();
      this.createUserForm.get('password')?.disable();


      console.log('Email changed to:', this.email);
      
      // Auto-generate username after a short delay to avoid spamming
      setTimeout(() => {
        const emailPrefix = this.email.split('@')[0];
        this.username = `${emailPrefix}_${Date.now()}`;
        this.createUserForm.get('username')?.setValue(this.username);
      }, 300);
    } else {
      // Clear username and password if email is invalid
      console.log('Invalid email format. Resetting username and password.');
      this.username = '';
      this.generatedPassword = null;
      this.isCopySuccess = false;
      
      this.createUserForm.get('username')?.setValue('');
      this.createUserForm.get('password')?.setValue('');
    }
  }

  generateUsername(): void {
    if (this.email.includes('@')) {
      const emailPrefix = this.email.split('@')[0];
      this.username = `${emailPrefix}_${Date.now()}`;
      this.createUserForm.get('username')?.setValue(this.username);
    } else {
      console.warn('Cannot generate username from invalid email');
    }
  }

  copyPassword(): void {
    if (!this.generatedPassword) return;

    // Try Clipboard API first (works in secure contexts like HTTPS or localhost)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(this.generatedPassword).then(() => {
        this.isCopySuccess = true;
        
        setTimeout(() => {
          this.isCopySuccess = false;
        }, 2000);
      }).catch(err => {
        console.error('Clipboard API failed:', err);
        this.fallbackCopy();
      });
    } else {
      // Fallback for non-secure contexts or older browsers
      this.fallbackCopy();
    }
  }

  fallbackCopy(): void {
    const textArea = document.createElement('textarea');
    textArea.value = this.generatedPassword || '';
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.isCopySuccess = true;
        
        setTimeout(() => {
          this.isCopySuccess = false;
        }, 2000);
      } else {
        console.error('Failed to copy password. Please select and copy manually.');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      console.error('Failed to copy password. Please select and copy manually.');
    } finally {
      document.body.removeChild(textArea);
    }
  }

  createUser(): void {
    if (!this.email || !this.role) {
      console.error('Please fill in all required fields');
      return;
    }

    if (!this.email.includes('@')) {
      console.error('Invalid email format. Please enter a valid email address.');
      return;
    }

    if (!this.generatedPassword) {
      console.error('Please generate a password first');
      return;
    }

    this.isLoading = true;
    
    this.adminService.createUser(this.username || `user_${Date.now()}`, this.email, this.generatedPassword, this.role as 'User' | 'Admin',
    ).then(() => {
      console.log('User created successfully!');
      this.resetForm();
    }).catch(error => {
      console.error('Error creating user:', error);
      console.error('Failed to create user. Please try again.');
    })
    .finally(() => {
      this.isLoading = false;
    });
  }

  resetForm(): void {
    this.email = '';
    this.username = '';
    this.role = 'User';
    this.generatedPassword = null;
    this.isCopySuccess = false;
    
    // Reset form controls
    this.createUserForm.reset();
    this.createUserForm.get('username')?.disable();
    this.createUserForm.get('password')?.disable();
    this.isLoading = false;
    this.cdr.detectChanges();
  }
}
