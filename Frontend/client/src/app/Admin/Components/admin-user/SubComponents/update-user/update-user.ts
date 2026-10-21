import { Component, OnInit, ViewChild, ElementRef, Input, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../../Services/admin-service';
import { UserService } from '../../../../../Services/user-service';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { User } from '../../../../../MusicPlayer/Models/user';

@Component({
  selector: 'app-update-user',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [UserService],
  templateUrl: './update-user.html',
  styleUrl: './update-user.css',
})
export class UpdateUser implements OnInit {
  @ViewChild('userSearchInput') userSearchInput!: ElementRef;
  @Input() user: User | null = null;

  users$!: any[];
  filteredUsers$: any[] = [];
  selectedUserId: number | null = null;
  
 
  generatedPassword: string | null = null;
  isLoading: boolean = false;
  isCopySuccess: boolean = false;
  showSearchDropdown: boolean = false;

  searchTerm: string = '';

  updateUserForm = new FormGroup({
    email: new FormControl({ value: '', disabled: true }),
    username: new FormControl({ value: '', disabled: true }),
    password: new FormControl({ value: '', disabled: true }),
    confirmPassword: new FormControl({ value: '', disabled: true })
  });

  constructor(
    private adminService: AdminService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // this.userService.getUserList().subscribe(users => {
    //   this.users$ = users;
    //   this.filteredUsers$ = users;
    // });
    if(this.user){
      this.loadUserForUpdate(this.user);
      this.updateUserForm.get('email')?.enable();
      this.updateUserForm.get('username')?.enable();
    }
  }

  // Called from user list when update button is clicked
  loadUserForUpdate(user: any): void {
    console.log('Loading user for update:', user);
    
    this.selectedUserId = user.id;
    this.updateUserForm.get('email')?.setValue(user.email || '');
    this.updateUserForm.get('username')?.setValue(user.username || '');
    this.generatedPassword = null; // Reset password on new selection
    
    // Update form controls
    this.updateUserForm.patchValue({
      email: this.updateUserForm.get('email')?.value,
      username: this.updateUserForm.get('username')?.value
    });
    
    this.updateUserForm.get('username')?.enable();
    this.updateUserForm.get('email')?.enable();
    
    console.log('User loaded for update:', { email: this.updateUserForm.get('email')?.value, username: this.updateUserForm.get('username')?.value });
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    
    if (this.searchTerm === '') {
      this.filteredUsers$ = this.users$;
    } else {
      this.filteredUsers$ = this.users$.filter(user => 
        user.username?.toLowerCase().includes(this.searchTerm) ||
        user.email?.toLowerCase().includes(this.searchTerm)
      );
    }
    
    this.showSearchDropdown = true;
  }

  selectUser(user: any): void {
    if (user.id === this.selectedUserId) return; // Already selected
    
    this.selectedUserId = user.id;
    this.updateUserForm.get('email')?.setValue(user.email || '');
    this.updateUserForm.get('username')?.setValue(user.username || '');
    this.generatedPassword = null;
    
    this.updateUserForm.patchValue({
      email: this.updateUserForm.get('email')?.value,
      username: this.updateUserForm.get('username')?.value
    });
    
    this.updateUserForm.get('username')?.enable();
    this.updateUserForm.get('email')?.enable();
    
    this.showSearchDropdown = false;
  }

  async generatePassword(): Promise<void> {
    // Only reset copy success message on regeneration
    this.isCopySuccess = false;
    
    // Set loading state to prevent double-clicks
    this.isLoading = true;

    if (!this.selectedUserId || !this.updateUserForm.get('email')?.value) {
      alert('Please select a user and ensure email is valid');
      this.isLoading = false;
      return;
    }
    
    try {
      const result = await this.adminService.generatePassword();
      
      if (result.success && result.password) {
        console.log('Generated password:', result.password);
        
        // Update form controls with new password - UI stays visible!
        this.generatedPassword = result.password;
        this.updateUserForm.get('password')?.setValue(result.password);
        this.updateUserForm.get('username')?.enable();
        this.updateUserForm.get('email')?.enable();
        this.updateUserForm.get('confirmPassword')?.enable();
        
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
        alert('Failed to copy password. Please select and copy manually.');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      alert('Failed to copy password. Please select and copy manually.');
    } finally {
      document.body.removeChild(textArea);
    }
  }

  async updateUser(): Promise<void> {
    if (!this.selectedUserId || !this.updateUserForm.get('email')?.value) {
      alert('Please select a user and ensure email is valid');
      return;
    }

    const actualEmail = this.updateUserForm.get('email')?.value;
    if (!actualEmail) {
      alert('Please enter a valid email address.');
      return;
    }
    if (!actualEmail.includes('@')) {
      alert('Invalid email format. Please enter a valid email address.');
      return;
    }

    // If password was generated, include it in update
    const updateData: any = {
      id: this.selectedUserId,
      email: this.updateUserForm.get('email')?.value,
      username: this.updateUserForm.get('username')?.value,
      password: this.updateUserForm.get('password')?.value || null
    };

    this.isLoading = true;

    console.log('Updating user with data:', updateData);
    
    //Update the user via admin service
    await this.adminService.updateUser(updateData).then(() => {
      alert('User updated successfully!');
      this.resetForm();
    }).catch(error => {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    })
    .finally(() => {
      this.isLoading = false;
    });
  }

  resetForm(): void {
    this.selectedUserId = null;
    this.updateUserForm.get('email')?.setValue('');
    this.updateUserForm.get('username')?.setValue('');
    this.updateUserForm.get('password')?.setValue('');
    this.updateUserForm.get('confirmPassword')?.setValue('');
    this.generatedPassword = null;
    this.isCopySuccess = false;
    
    // Reset form controls
    this.updateUserForm.reset();
    this.updateUserForm.get('username')?.disable();
    this.updateUserForm.get('email')?.disable();
    this.isLoading = false;
  }

  closeSearchDropdown(): void {
    setTimeout(() => {
      this.showSearchDropdown = false;
    }, 100);
  }
}
