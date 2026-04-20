import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/auth`;

type AuthResponse = {
  token?: string;
  jwt?: string;
  accessToken?: string;
  message?: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<string> {
    return this.request('/login', email, password).pipe(
      map((response) => {
        const token = this.extractToken(response);
        if (!token) {
          throw new Error('Login failed. Please try again.');
        }

        const jwt = this.normalizeToken(token);
        localStorage.setItem('token', jwt);
        localStorage.setItem('userEmail', email);
        return jwt;
      })
    );
  }

  register(email: string, password: string): Observable<string> {
    return this.request('/register', email, password).pipe(
      map((response) => this.extractMessage(response) || 'Registration successful')
    );
  }

  logout(): void {
    localStorage.clear();
  }

  get token(): string | null {
    const token = localStorage.getItem('token');
    return token ? this.normalizeToken(token) : null;
  }

  get userEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  get isLoggedIn(): boolean {
    return Boolean(this.token);
  }

  private request(endpoint: '/login' | '/register', email: string, password: string): Observable<string | AuthResponse> {
    return this.http.post(`${API_URL}${endpoint}`, { email, password }, { 
      responseType: 'text',
      withCredentials: true 
    }).pipe(
      map((response) => this.parseResponse(response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Auth API error:', error);
        const message = endpoint === '/login'
          ? 'Login failed. Please check your email and password.'
          : 'Signup failed. Please try again later.';
        return throwError(() => new Error(message));
      })
    );
  }

  private parseResponse(response: string): string | AuthResponse {
    const trimmed = response.trim();

    if (!trimmed) {
      return '';
    }

    try {
      return JSON.parse(trimmed) as AuthResponse;
    } catch {
      return trimmed;
    }
  }

  private extractToken(response: string | AuthResponse): string {
    if (typeof response === 'string') {
      return response;
    }

    return response.token ?? response.jwt ?? response.accessToken ?? '';
  }

  private extractMessage(response: string | AuthResponse): string {
    return typeof response === 'string' ? response.trim() : response.message?.trim() ?? '';
  }

  private normalizeToken(token: string): string {
    return token.trim().replace(/^Bearer\s+/i, '').replace(/^"|"$/g, '');
  }
}
