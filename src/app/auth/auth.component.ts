import { Component } from '@angular/core';
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

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
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
  }

  submit(): void {
    const email = this.email.trim();

    if (!email || !this.password) {
      alert('Please enter email and password.');
      return;
    }

    const request = this.isLogin
      ? this.authService.login(email, this.password)
      : this.authService.register(email, this.password);

    request.subscribe({
      next: () => {
        if (this.isLogin) {
          void this.router.navigateByUrl('/');
          return;
        }

        alert('Registration Successful! Please Login.');
        this.toggleMode();
      },
      error: (error: Error) => {
        console.error('Auth Error:', error);
        alert(error.message || 'Server connection failed.');
      }
    });
  }
}
