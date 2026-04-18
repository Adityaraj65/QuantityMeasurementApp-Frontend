import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, RouterLink],
  templateUrl: './auth.component.html'
})
export class AuthComponent {
  email = '';
  password = '';
  isLogin = true;
  message = '';
  isError = false;
  isSubmitting = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get title(): string {
    return this.isLogin ? 'Welcome Back' : 'Create Account';
  }

  get subtitle(): string {
    return this.isLogin ? 'Login to access your history' : 'Join QuantifyPro today';
  }

  get submitLabel(): string {
    return this.isLogin ? 'Login' : 'Register';
  }

  get toggleLabel(): string {
    return this.isLogin ? "Don't have an account?" : 'Already have an account?';
  }

  get toggleButtonLabel(): string {
    return this.isLogin ? 'Sign Up' : 'Login';
  }

  toggleMode(): void {
    this.isLogin = !this.isLogin;
    this.message = '';
    this.isError = false;
  }

  submit(): void {
    if (this.isSubmitting) {
      return;
    }

    const email = this.email.trim();
    this.message = '';
    this.isError = false;

    if (!email || !this.password) {
      this.showError('Please enter email and password.');
      return;
    }

    const request = this.isLogin
      ? this.authService.login(email, this.password)
      : this.authService.register(email, this.password);

    this.isSubmitting = true;
    this.message = this.isLogin ? 'Logging in...' : 'Creating your account...';
    this.isError = false;
    this.cdr.detectChanges();

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        if (this.isLogin) {
          void this.router.navigateByUrl('/');
          return;
        }

        this.toggleMode();
        this.showSuccess('Registration successful. Please login.');
      },
      error: (error: Error) => {
        this.isSubmitting = false;
        console.error('Auth Error:', error);
        this.showError(error.message || 'Something went wrong. Please try again.');
      }
    });
  }

  private showError(message: string): void {
    this.message = message;
    this.isError = true;
    this.cdr.detectChanges();
  }

  private showSuccess(message: string): void {
    this.message = message;
    this.isError = false;
    this.cdr.detectChanges();
  }
}
