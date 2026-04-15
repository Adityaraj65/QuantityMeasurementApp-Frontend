import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

const API_URL = 'http://localhost:8080/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<string> {
    return this.request('/login', email, password).pipe(
      map((token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', email);
        return token;
      })
    );
  }

  register(email: string, password: string): Observable<string> {
    return this.request('/register', email, password);
  }

  logout(): void {
    localStorage.clear();
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  get isLoggedIn(): boolean {
    return Boolean(this.token);
  }

  private request(endpoint: '/login' | '/register', email: string, password: string): Observable<string> {
    return this.http.post(`${API_URL}${endpoint}`, { email, password }, { responseType: 'text' }).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = typeof error.error === 'string' && error.error
          ? error.error
          : 'Authentication failed';
        return throwError(() => new Error(message));
      })
    );
  }
}
